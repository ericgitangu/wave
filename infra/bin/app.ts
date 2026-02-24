#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WaveSubmissionStack } from "../lib/submission-stack";
import { WaveVoiceStack } from "../lib/voice-stack";
import { WaveBedrockStack } from "../lib/bedrock-stack";
import { WaveSageMakerStack } from "../lib/sagemaker-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "us-east-1",
};

// Bedrock stack creates the shared Docker image and EventBridge bus
const bedrockStack = new WaveBedrockStack(app, "WaveBedrockStack", { env });

// Submission and Voice stacks reuse the Docker image from Bedrock stack
new WaveSubmissionStack(app, "WaveSubmissionStack", {
  env,
  dockerImage: bedrockStack.dockerImage,
});

new WaveVoiceStack(app, "WaveVoiceStack", {
  env,
  dockerImage: bedrockStack.dockerImage,
  eventBusArn: bedrockStack.eventBus.eventBusArn,
});

new WaveSageMakerStack(app, "WaveSageMakerStack", {
  env,
  dockerImage: bedrockStack.dockerImage,
});
