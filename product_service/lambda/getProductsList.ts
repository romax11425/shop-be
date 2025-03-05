import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Product, ProductWithStock } from "../model/product";
import { Stock } from "../model/stock";
import { logger } from "../utils/logger";

export const handler = async () => {

    try {
        logger.info('Getting products list');

        const client = new DynamoDBClient({ region: "eu-central-1" });
        const dynamodb = DynamoDBDocumentClient.from(client);

        const productsResult = await dynamodb.send(new ScanCommand({
            TableName: "Products",
        }));

        const stocksResult = await dynamodb.send(new ScanCommand({
            TableName: "Stocks",
        }));

        const products: Product[] = productsResult.Items as Product[] || [];
        const stocks: Stock[] = stocksResult.Items as Stock[] || [];

        const mappedProducts: ProductWithStock[] = products.map((product) => {
            const stock = stocks.find((stock) => stock.product_id === product.id);
            return {
                ...product,
                count: stock?.count || 0
            };
        });

        logger.info(`Found ${mappedProducts.length} products`);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(mappedProducts),
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