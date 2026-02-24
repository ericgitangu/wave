import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as path from "path";
import { Construct } from "constructs";

interface WaveSubmissionStackProps extends cdk.StackProps {
  dockerImage?: ecr_assets.DockerImageAsset;
}

export class WaveSubmissionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WaveSubmissionStackProps) {
    super(scope, id, props);

    const account = cdk.Stack.of(this).account;

    // DynamoDB table
    const table = new dynamodb.Table(this, "WaveTable", {
      tableName: "wave-submissions",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ExpiresAt",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // S3 bucket for payload storage
    const payloadBucket = new s3.Bucket(this, "PayloadBucket", {
      bucketName: `wave-submissions-${account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // SSM parameter reference for bearer token
    const bearerToken = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "BearerToken",
      { parameterName: "/wave/bearer-token" }
    );

    // Docker image for Lambda (built from Rust+PyO3)
    const dockerImage =
      props?.dockerImage ??
      new ecr_assets.DockerImageAsset(this, "SubmissionLambdaImage", {
        directory: path.join(__dirname, "../../backend"),
        file: "Dockerfile.lambda",
        platform: ecr_assets.Platform.LINUX_AMD64,
      });

    // Lambda function — DockerImageFunction with compiled Rust .so
    const fn = new lambda.DockerImageFunction(this, "SubmissionHandler", {
      functionName: "wave-submission-handler",
      code: lambda.DockerImageCode.fromEcr(dockerImage.repository, {
        tagOrDigest: dockerImage.imageTag,
        cmd: ["handler.handler"],
      }),
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      environment: {
        TABLE_NAME: table.tableName,
        BEARER_TOKEN_PARAM: "/wave/bearer-token",
        PAYLOAD_BUCKET: payloadBucket.bucketName,
      },
    });

    table.grantReadWriteData(fn);
    payloadBucket.grantReadWrite(fn);
    bearerToken.grantRead(fn);

    // EventBridge rule: run every 24 hours
    const rule = new events.Rule(this, "DailySchedule", {
      ruleName: "wave-daily-submission",
      schedule: events.Schedule.rate(cdk.Duration.hours(24)),
    });
    rule.addTarget(new targets.LambdaFunction(fn));

    // SNS topic for notifications
    const topic = new sns.Topic(this, "SubmissionTopic", {
      topicName: "wave-submissions",
    });

    const notificationEmail = this.node.tryGetContext("notificationEmail");
    if (notificationEmail) {
      topic.addSubscription(
        new subscriptions.EmailSubscription(notificationEmail)
      );
    }

    // SSM parameters for cross-stack references
    new ssm.StringParameter(this, "TableNameParam", {
      parameterName: "/wave/table-name",
      stringValue: table.tableName,
    });

    new ssm.StringParameter(this, "LambdaArnParam", {
      parameterName: "/wave/submission-lambda-arn",
      stringValue: fn.functionArn,
    });

    new ssm.StringParameter(this, "TopicArnParam", {
      parameterName: "/wave/sns-topic-arn",
      stringValue: topic.topicArn,
    });
  }
}
