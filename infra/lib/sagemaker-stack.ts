import * as cdk from "aws-cdk-lib";
import * as sagemaker from "aws-cdk-lib/aws-sagemaker";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface WaveSageMakerStackProps extends cdk.StackProps {
  dockerImage: ecr_assets.DockerImageAsset;
}

export class WaveSageMakerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WaveSageMakerStackProps) {
    super(scope, id, props);

    const account = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    // SageMaker execution role
    const sagemakerRole = new iam.Role(this, "SageMakerRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"),
      ],
    });

    // HuggingFace Deep Learning Container for text classification
    const hfImageUri = `763104351884.dkr.ecr.${region}.amazonaws.com/huggingface-pytorch-inference:2.1.0-transformers4.37.0-cpu-py310-ubuntu22.04`;

    // SageMaker Model: XLM-RoBERTa language detection
    const model = new sagemaker.CfnModel(this, "LangDetectModel", {
      modelName: "wave-lang-detect-model",
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image: hfImageUri,
        environment: {
          HF_MODEL_ID: "papluca/xlm-roberta-base-language-detection",
          HF_TASK: "text-classification",
          SAGEMAKER_CONTAINER_LOG_LEVEL: "20",
        },
      },
    });

    // Endpoint configuration
    const endpointConfig = new sagemaker.CfnEndpointConfig(
      this,
      "LangDetectEndpointConfig",
      {
        endpointConfigName: "wave-lang-detect-config",
        productionVariants: [
          {
            variantName: "primary",
            modelName: model.modelName!,
            initialInstanceCount: 1,
            instanceType: "ml.m5.large",
            initialVariantWeight: 1.0,
          },
        ],
      }
    );
    endpointConfig.addDependency(model);

    // SageMaker endpoint
    const endpoint = new sagemaker.CfnEndpoint(this, "LangDetectEndpoint", {
      endpointName: "wave-lang-detect",
      endpointConfigName: endpointConfig.endpointConfigName!,
    });
    endpoint.addDependency(endpointConfig);

    // Lambda for language detection
    const langDetectFn = new lambda.DockerImageFunction(
      this,
      "SageMakerLangDetectHandler",
      {
        functionName: "wave-sagemaker-langdetect",
        code: lambda.DockerImageCode.fromEcr(
          props.dockerImage.repository,
          {
            tagOrDigest: props.dockerImage.imageTag,
            cmd: ["sagemaker_handler.handler"],
          }
        ),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: {
          SAGEMAKER_ENDPOINT: "wave-lang-detect",
        },
      }
    );

    // SageMaker invoke permissions
    langDetectFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sagemaker:InvokeEndpoint"],
        resources: [
          `arn:aws:sagemaker:${region}:${account}:endpoint/wave-lang-detect`,
        ],
      })
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

    new ssm.StringParameter(this, "SageMakerEndpointParam", {
      parameterName: "/wave/sagemaker-endpoint-name",
      stringValue: "wave-lang-detect",
    });

    new cdk.CfnOutput(this, "LangDetectApiEndpoint", {
      value: httpApi.apiEndpoint,
    });

    new cdk.CfnOutput(this, "SageMakerEndpointName", {
      value: "wave-lang-detect",
    });
  }
}
