import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as path from "path";
import { Construct } from "constructs";

interface WaveVoiceStackProps extends cdk.StackProps {
  dockerImage?: ecr_assets.DockerImageAsset;
  eventBusArn?: string;
}

export class WaveVoiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WaveVoiceStackProps) {
    super(scope, id, props);

    // SSM parameter reference for Anthropic API key
    const anthropicApiKey =
      ssm.StringParameter.fromSecureStringParameterAttributes(
        this,
        "AnthropicApiKey",
        { parameterName: "/wave/anthropic-api-key" }
      );

    // Docker image for Lambda (built from Rust+PyO3)
    const dockerImage =
      props?.dockerImage ??
      new ecr_assets.DockerImageAsset(this, "VoiceLambdaImage", {
        directory: path.join(__dirname, "../../backend"),
        file: "Dockerfile.lambda",
        platform: ecr_assets.Platform.LINUX_AMD64,
      });

    // Lambda function — DockerImageFunction with compiled Rust .so
    const fn = new lambda.DockerImageFunction(this, "VoiceHandler", {
      functionName: "wave-voice-handler",
      code: lambda.DockerImageCode.fromEcr(dockerImage.repository, {
        tagOrDigest: dockerImage.imageTag,
        cmd: ["voice_handler.handler"],
      }),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ANTHROPIC_API_KEY_PARAM: "/wave/anthropic-api-key",
        EVENT_BUS_NAME: "wave-ml-events",
      },
    });

    anthropicApiKey.grantRead(fn);

    // EventBridge PutEvents permission for downstream ML processing
    const eventBusArn =
      props?.eventBusArn ??
      `arn:aws:events:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:event-bus/wave-ml-events`;

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["events:PutEvents"],
        resources: [eventBusArn],
      })
    );

    // HTTP API with CORS
    const httpApi = new apigwv2.HttpApi(this, "VoiceApi", {
      apiName: "wave-voice-api",
      corsPreflight: {
        allowOrigins: [
          "https://wave-apply.ericgitangu.com",
          "http://localhost:3000",
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: cdk.Duration.hours(1),
      },
    });

    httpApi.addRoutes({
      path: "/voice",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "VoiceLambdaIntegration",
        fn
      ),
    });

    // SSM parameter for API URL
    new ssm.StringParameter(this, "VoiceApiUrlParam", {
      parameterName: "/wave/voice-api-url",
      stringValue: httpApi.apiEndpoint,
    });

    new cdk.CfnOutput(this, "VoiceApiEndpoint", {
      value: httpApi.apiEndpoint,
    });
  }
}
