import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface WaveSageMakerStackProps extends cdk.StackProps {
  dockerImage: ecr_assets.DockerImageAsset;
}

/**
 * Language detection stack — uses langdetect library inside Lambda.
 *
 * Replaced the always-on SageMaker XLM-RoBERTa endpoint (~$86/mo)
 * with an in-process langdetect call ($0/mo within Lambda free tier).
 */
export class WaveSageMakerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WaveSageMakerStackProps) {
    super(scope, id, props);

    // Lambda for language detection (now uses langdetect, no SageMaker)
    const langDetectFn = new lambda.DockerImageFunction(
      this,
      "LangDetectHandler",
      {
        functionName: "wave-langdetect",
        code: lambda.DockerImageCode.fromEcr(
          props.dockerImage.repository,
          {
            tagOrDigest: props.dockerImage.imageTag,
            cmd: ["sagemaker_handler.handler"],
          }
        ),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        architecture: lambda.Architecture.ARM_64,
      }
    );

    // HTTP API Gateway for /detect-language
    const httpApi = new apigwv2.HttpApi(this, "LangDetectApi", {
      apiName: "wave-langdetect-api",
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
      path: "/detect-language",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "LangDetectIntegration",
        langDetectFn
      ),
    });

    // SSM params
    new ssm.StringParameter(this, "LangDetectApiUrlParam", {
      parameterName: "/wave/langdetect-api-url",
      stringValue: httpApi.apiEndpoint,
    });

    new cdk.CfnOutput(this, "LangDetectApiEndpoint", {
      value: httpApi.apiEndpoint,
    });
  }
}
