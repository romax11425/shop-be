import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

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
		stocksTable.grantReadData(getProductsListFunction);

		productsTable.grantReadData(getProductsByIdFunction);
		stocksTable.grantReadData(getProductsByIdFunction);

		productsTable.grantWriteData(createProduct);
		stocksTable.grantWriteData(createProduct);

		// Define lambda resources and methods
		const products = api.root.addResource('products');
		products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction));
		products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

		const productsById = products.addResource('{productId}');
		productsById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdFunction));

	}
}
