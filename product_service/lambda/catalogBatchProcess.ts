import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { logger } from "../utils/logger";

const awsRegion = process.env.AWS_REGION || 'eu-west-1';
const productsTable = process.env.PRODUCTS_TABLE || 'Products';
const stocksTable = process.env.STOCKS_TABLE || 'Stocks';

const sns = new SNSClient({ region: awsRegion });

export const handler = async (event: any) => {
    try {

        const client = new DynamoDBClient({ region: awsRegion });
        const dynamodb = DynamoDBDocumentClient.from(client);
        
        for (const sqsRecord of event.Records) {
            const data = JSON.parse(sqsRecord.body);

            const id = randomUUID();
            const { title, description, price, count } = data;

            const product = {
                id,
                title,
                description,
                price
            };

            const stock = {
                product_id: id,
                count
            };

            await dynamodb.send(new PutCommand({
                TableName: productsTable,
                Item: product
            }));

            await dynamodb.send(new PutCommand({
                TableName: stocksTable,
                Item: stock
            }));

            await sns.send(new PublishCommand({
                TopicArn: process.env.CREATE_PRODCUT_TOPIC_ARN,
                Message: JSON.stringify({
                    message: 'Product created',
                    product
                })
            }));
        }

    } catch (error) {
        logger.error('Error processing products:', { error });

        await sns.send(new PublishCommand({
            TopicArn: process.env.CREATE_PRODCUT_TOPIC_ARN,
            Message: JSON.stringify({ error }),
            Subject: 'Error Creating Products',
        }));
        throw error;
    }
}