import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import path = require('path');
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as subscription from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dotenv from 'dotenv';

dotenv.config({path: path.join(__dirname, '../.env')});

const firstEmail = process.env.FIRST_EMAIL || 'firstemail@example.com';
const secondaryEmail = process.env.SECONDARY_EMAIL || 'secondaryemail@example.com';

export class NodejsAwsShopReactBackendStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: cdk.StackProps) {
		super(scope, id, props);

		// Define DynamoDB table
		const productsTable = new dynamodb.Table(this, 'ProductsTable', {
			partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
			tableName: 'Products',
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const stocksTable = new dynamodb.Table(this, 'StocksTable', {
			partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
			tableName: 'Stocks',
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
			topicName: 'CreateProductTopic',
		});

		const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
			queueName: 'CatalogItemsQueue',
		});

		//Define Lambda function resource
		const getProductsListFunction = new NodejsFunction(this, 'GetProductsListFunction', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'handler',
			entry: path.join(__dirname, '../lambda/getProductsList.ts'),
			environment: {
				PRODUCTS_TABLE_NAME: productsTable.tableName,
				STOCKS_TABLE_NAME: stocksTable.tableName,
			},
		});

		const getProductsByIdFunction = new NodejsFunction(this, 'GetProductsByIdFunction', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'handler',
			entry: path.join(__dirname, '../lambda/getProductsById.ts'),
			environment: {
				PRODUCTS_TABLE_NAME: productsTable.tableName,
				STOCKS_TABLE_NAME: stocksTable.tableName,
			},
		});

		const createProduct = new NodejsFunction(this, 'CreateProduct', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'handler',
			entry: path.join(__dirname, '../lambda/createProduct.ts'),
			environment: {
				PRODUCTS_TABLE_NAME: productsTable.tableName,
				STOCKS_TABLE_NAME: stocksTable.tableName,
			},
		});

		const catalogBatchProcessFunction = new NodejsFunction(this, 'catalogBatchProcess', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'handler',
			entry: path.join(__dirname, '../lambda/catalogBatchProcess.ts'),
			environment: {
				PRODUCTS_TABLE_NAME: productsTable.tableName,
				STOCKS_TABLE_NAME: stocksTable.tableName,
				CREATE_PRODCUT_TOPIC_ARN: createProductTopic.topicArn,
			},
		});

		// Define API Gateway resource
		const api = new apigateway.RestApi(this, 'ProductServiceApi', {
			restApiName: 'Product Service',
            defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: ['GET'],
				allowHeaders: ['Content-Type'],
            },
		});

		productsTable.grantReadData(getProductsListFunction);
		productsTable.grantReadData(getProductsByIdFunction);
		productsTable.grantWriteData(createProduct);
		productsTable.grantWriteData(catalogBatchProcessFunction);

		stocksTable.grantReadData(getProductsListFunction);
		stocksTable.grantReadData(getProductsByIdFunction);
		stocksTable.grantWriteData(createProduct);
		stocksTable.grantWriteData(catalogBatchProcessFunction);

		catalogItemsQueue.grantConsumeMessages(catalogBatchProcessFunction);
		createProductTopic.grantPublish(catalogBatchProcessFunction);

		// Define lambda resources and methods
		const products = api.root.addResource('products');
		products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction));
		products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

		const productsById = products.addResource('{productId}');
		productsById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdFunction));

		// Define SQS resource
		catalogBatchProcessFunction.addEventSource(new SqsEventSource(catalogItemsQueue, {
			batchSize: 5,
		}));

		// Define SNS resource
		createProductTopic.addSubscription(new subscription.EmailSubscription(firstEmail, {
			filterPolicy: {
				price: sns.SubscriptionFilter.numericFilter({lessThan: 20}),
			},
			json: false,
		}));

		createProductTopic.addSubscription(new subscription.EmailSubscription(secondaryEmail, {
			filterPolicy: {
				price: sns.SubscriptionFilter.numericFilter({greaterThan: 20}),
			},
			json: false,
		}));
	}
}
