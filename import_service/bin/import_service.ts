#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImportServiceStack } from '../lib/import_service-stack';

const app = new cdk.App();

new ImportServiceStack(app, 'ImportServiceStack', {
  env: { 
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  basicAuthorizer: 'arn:aws:lambda:eu-west-1:605134451272:function:basicAuthorizer',
});
app.synth();
