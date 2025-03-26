import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class NodejsAwsShopReactBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

	// Create SNS Topic
	const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
	  topicName: 'createProductTopic',
	});

	// Add email subscription
	createProductTopic.addSubscription(
	  new subscriptions.EmailSubscription('romax114@gmail.com', {
		filterPolicy: {
		  price: sns.SubscriptionFilter.numericFilter({
			greaterThanOrEqualTo: 800,
		  }),
		},
		json: false,
	  })
	);
	createProductTopic.addSubscription(
	  new subscriptions.EmailSubscription('romax114@mail.ru', {
		filterPolicy: {
		  price: sns.SubscriptionFilter.numericFilter({
			lessThan: 800,
		  }),
		},
		json: false,
	  })
	);

	// Create SQS Queue
	const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
	  queueName: 'catalogItemsQueue',
	});

	// Define the Lambda function using NodejsFunction
	const getProductsFunction = new NodejsFunction(this, 'GetProductsFunction', {
	  runtime: lambda.Runtime.NODEJS_18_X,
	  handler: 'handler',
	  entry: path.join(__dirname, '../lambda/getProductsList.ts'),
	  bundling: {
		externalModules: [],
		minify: true,
		sourceMap: true,
	  },
	  environment: {
		PRODUCTS_TABLE: productsTable.tableName,
		STOCKS_TABLE: stocksTable.tableName,
	  },
	});

	// Add the getProductById function
	const getProductByIdFunction = new NodejsFunction(this, 'GetProductByIdFunction', {
	  runtime: lambda.Runtime.NODEJS_18_X,
	  handler: 'handler',
	  entry: path.join(__dirname, '../lambda/getProductsById.ts'),
	  bundling: {
		externalModules: [],
		minify: true,
		sourceMap: true,
	  },
	  environment: {
		PRODUCTS_TABLE: productsTable.tableName,
		STOCKS_TABLE: stocksTable.tableName,
	  },
	});

	// Define the Lambda function for createProduct
	const createProductFunction = new NodejsFunction(this, 'CreateProductFunction', {
	  runtime: lambda.Runtime.NODEJS_18_X,
	  handler: 'handler',
	  entry: path.join(__dirname, '../lambda/getProductsById.ts'),
	  bundling: {
		externalModules: [],
		minify: true,
		sourceMap: true,
	  },
	  environment: {
		PRODUCTS_TABLE: productsTable.tableName,
		STOCKS_TABLE: stocksTable.tableName,
	  },
	  timeout: cdk.Duration.seconds(30),
	});

	// Create Lambda function
	const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcess', {
	  runtime: lambda.Runtime.NODEJS_18_X,
	  handler: 'handler',
	  entry: path.join(__dirname, '../lambda/catalogBatchProcess.ts'),
	  timeout: cdk.Duration.seconds(30),
	  bundling: {
		externalModules: [],
		minify: true,
		sourceMap: true,
	  },
	  environment: {
		SNS_TOPIC_ARN: createProductTopic.topicArn,
		PRODUCTS_TABLE: productsTable.tableName,
		STOCKS_TABLE: stocksTable.tableName,
	  },
	});

	// Add SQS as event source for Lambda
	catalogBatchProcess.addEventSource(new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
	  batchSize: 5,
	}));

	// Grant permissions to Lambda functions
	productsTable.grantReadData(getProductsFunction);
	stocksTable.grantReadData(getProductsFunction);
	productsTable.grantReadData(getProductByIdFunction);
	stocksTable.grantReadData(getProductByIdFunction);
	productsTable.grantWriteData(createProductFunction);
	stocksTable.grantWriteData(createProductFunction);
	productsTable.grantWriteData(catalogBatchProcess);
	stocksTable.grantWriteData(catalogBatchProcess);
	createProductTopic.grantPublish(catalogBatchProcess);
	catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

	// Create API Gateway
	const api = new apigateway.RestApi(this, 'ProductsApi', {
	  restApiName: 'Products Service',
	  defaultCorsPreflightOptions: {
		allowOrigins: apigateway.Cors.ALL_ORIGINS,
		allowMethods: apigateway.Cors.ALL_METHODS,
		allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
		allowCredentials: true,
	  },
	});

	// Create products resource and methods
	const products = api.root.addResource('products');
	products.addMethod('GET', new apigateway.LambdaIntegration(getProductsFunction));
	products.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction));

	const product = products.addResource('{id}');
	product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdFunction));

	// Output the API Gateway URL
	new cdk.CfnOutput(this, 'ProductsApiEndpoint', {
	  value: api.url,
	  description: 'The URL of the Products API',
	});
  }
}