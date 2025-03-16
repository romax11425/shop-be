import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import path = require('path');

export class ImportServiceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const bucket = s3.Bucket.fromBucketName(this, 'ImportBucket', 'romax114-import-service-bucket');

		const catalogItemsQueue = sqs.Queue.fromQueueArn(
			this,
			'CatalogItemsQueue',
			'arn:aws:sns:eu-west-1:605134451272:CreateProductTopic'
		  );

		const importProductsFileFunction = new NodejsFunction(this, 'ImportProductsFileFunction', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'handler',
			entry: path.join(__dirname, '../lambda/importProductsFile.ts'),
			environment: {
				BUCKET_NAME: bucket.bucketName,
				SQS_QUEUE_URL: catalogItemsQueue.queueUrl
			},
		});

		const importFileParserFunction = new NodejsFunction(this, 'ImportFileParserFunction', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'handler',
			entry: path.join(__dirname, '../lambda/importFileParser.ts'),
			environment: {
				BUCKET_NAME: bucket.bucketName,
			},
		});

		// Define API Gateway resource
		const api = new apigateway.RestApi(this, 'ImportServiceApi', {
			restApiName: 'Import Service',
            defaultCorsPreflightOptions: {        
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
				allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
            },
		});

		bucket.grantReadWrite(importProductsFileFunction);
		bucket.grantReadWrite(importFileParserFunction);

		catalogItemsQueue.grantSendMessages(importProductsFileFunction);

		const importResource = api.root.addResource('import');
		importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileFunction), {
			requestParameters: {
				'method.request.querystring.name': true,
			},
			requestValidatorOptions: {
				validateRequestParameters: true,
			},
		});

		bucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(importFileParserFunction),
			{ prefix: 'uploaded/' }
		);
	}
}