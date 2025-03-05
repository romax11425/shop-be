import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

export const handler = async (event: any) => {

    try {
        logger.info('Creating product', event);

        const id = randomUUID();
        const {title, description, price, count} = JSON.parse(event.body);
        const client = new DynamoDBClient({ region: "eu-central-1" });
        const dynamodb = DynamoDBDocumentClient.from(client);

        if (!title || !description || !price || price < 0 || !count || count < 0) {
            logger.error('Invalid request', event.body);
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify({ message: 'Invalid request' }),
            };
        }

        if (typeof title !== 'string' ||
            typeof description !== 'string' ||
            typeof price !== 'number' ||
            typeof count !== 'number') {
            logger.error('Invalid data types. Title and description must be strings, price and count must be numbers.', event.body);
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify({
                    message: 'Invalid data types. Title and description must be strings, price and count must be numbers.'
                }),
            };
        }

        const product = {
            TableName: "Products",
            Item: {
                id,
                title,
                description,
                price
            }
        };

        const stock = {
            TableName: "Stocks",
            Item: {
                product_id: id,
                count
            }
        };

        logger.info(`Creating product with id ${id}`, product, stock);
        await dynamodb.send(new TransactWriteCommand({
            TransactItems: [
                { Put: product },
                { Put: stock }
            ]
        }));

        logger.info(`Product with id ${id} created successfully`);
        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: "Product created successfully",
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