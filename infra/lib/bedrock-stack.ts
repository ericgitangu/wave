import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as path from "path";
import { Construct } from "constructs";

export class WaveBedrockStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly dockerImage: ecr_assets.DockerImageAsset;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for ML results
    const mlTable = new dynamodb.Table(this, "MlResultsTable", {
      tableName: "wave-ml-results",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ExpiresAt",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Docker image for all Lambda functions (shared across stacks)
    this.dockerImage = new ecr_assets.DockerImageAsset(this, "LambdaImage", {
      directory: path.join(__dirname, "../../backend"),
      file: "Dockerfile.lambda",
      platform: ecr_assets.Platform.LINUX_AMD64,
    });

    // Bedrock sentiment Lambda
    const sentimentFn = new lambda.DockerImageFunction(
      this,
      "BedrockSentimentHandler",
      {
        functionName: "wave-bedrock-sentiment",
        code: lambda.DockerImageCode.fromEcr(
          this.dockerImage.repository,
          {
            tagOrDigest: this.dockerImage.imageTag,
            cmd: ["bedrock_handler.handler"],
          }
        ),
        memorySize: 512,
        timeout: cdk.Duration.minutes(2),
        environment: {
          ML_RESULTS_TABLE: mlTable.tableName,
        },
      }
    );

    mlTable.grantReadWriteData(sentimentFn);

    // Bedrock permissions: Claude 3 Haiku + Titan Embeddings V2
    sentimentFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: [
          `arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          `arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0`,
        ],
      })
    );

    // Custom EventBridge bus for ML events
    this.eventBus = new events.EventBus(this, "MlEventBus", {
      eventBusName: "wave-ml-events",
    });

    // EventBridge rule: wave.voice / VoiceClassification → Bedrock Lambda
    new events.Rule(this, "VoiceToBedrockRule", {
      ruleName: "wave-voice-to-bedrock",
      eventBus: this.eventBus,
      eventPattern: {
        source: ["wave.voice"],
        detailType: ["VoiceClassification"],
      },
      targets: [new targets.LambdaFunction(sentimentFn)],
    });

    // SSM params for cross-stack references
    new ssm.StringParameter(this, "MlTableNameParam", {
      parameterName: "/wave/ml-table-name",
      stringValue: mlTable.tableName,
    });

    new ssm.StringParameter(this, "BedrockLambdaArnParam", {
      parameterName: "/wave/bedrock-lambda-arn",
      stringValue: sentimentFn.functionArn,
    });

    new ssm.StringParameter(this, "EventBusArnParam", {
      parameterName: "/wave/ml-event-bus-arn",
      stringValue: this.eventBus.eventBusArn,
    });

    new cdk.CfnOutput(this, "MlTableName", {
      value: mlTable.tableName,
    });

    new cdk.CfnOutput(this, "BedrockLambdaArn", {
      value: sentimentFn.functionArn,
    });
  }
}
