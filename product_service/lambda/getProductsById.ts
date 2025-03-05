import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Product, ProductWithStock } from "../model/product";
import { Stock } from "../model/stock";
import { logger } from "../utils/logger";

export const handler = async (event: any) => {

    try {
        logger.info('Getting product by id', event);
        
        const client = new DynamoDBClient({ region: "eu-central-1" });
        const dynamodb = DynamoDBDocumentClient.from(client);
        const productId = event.pathParameters?.productId;

        if (!productId) {
            logger.error('Missing product ID in request');
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify({ message: 'Product ID is required' }),
            }
        }

        const productsResult = await dynamodb.send(new GetCommand({
            TableName: "Products",
            Key: {
                id: productId
            }
        }));

        const stocksResult = await dynamodb.send(new GetCommand({
            TableName: "Stocks",
            Key: {
                product_id: productId
            }
        }));

        if (!productsResult.Item) {
            logger.error(`Product with id ${productId} not found`);
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify({ message: 'Product not found' }),
            };
        }

        const product: ProductWithStock = {
            ...productsResult.Item as Product,
            count: (stocksResult.Item as Stock)?.count || 0
        };

        logger.info(`Product with id ${productId} found: ${JSON.stringify(product)}`);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(product),
        };
        
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error: ${error.message}`);
        } else {
            logger.error('Unknown error');
        }
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: 'Internal Server Error'}),
        };   
    }
}