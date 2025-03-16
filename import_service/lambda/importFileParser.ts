import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { logger } from "../utils/logger";

const awsRegion = process.env.AWS_REGION || 'eu-west-1';
const sqsQueueUrl = process.env.SQS_QUEUE_URL || '';

const sqsClient = new SQSClient({ region: awsRegion });

export const handler = async (event: any) => {
    try {
        logger.info('Processing file', event);

        const s3Client = new S3Client({ region: awsRegion });
        const bucketName = event.Records[0].s3.bucket.name;
        const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

        const response = await s3Client.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        }));

        await new Promise((resolve, reject) => {
            logger.info('Parsing CSV file', objectKey);
            const stream = Readable.from(response.Body as Readable);
            stream.pipe(csvParser())
                .on('data', async (data: any) => {
                    await sendDataToSQS(data)
                })
                .on('error', (error: unknown) => {
                    logger.error('Error parsing:', error as Error);
                    reject(error);
                })
                .on('end', () => {
                    logger.info('CSV parsing completed');
                    resolve("Success");
                });
        });

        const newKey = objectKey.replace('uploaded/', 'parsed/');

        await s3Client.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${objectKey}`,
            Key: newKey,
        }));

        await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        }));

        logger.info('File processed');

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: 'File processed' }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}

async function sendDataToSQS(record: any): Promise<void> {
    try {
        const command = new SendMessageCommand({
            QueueUrl: sqsQueueUrl,
            MessageBody: JSON.stringify({
                title: record.title,
                description: record.description,
                price: Number(record.price),
                count: Number(record.count)
            }),
        });

        await sqsClient.send(command);
        logger.info('Successfully sent message to SQS:', record.title);
    } catch (error) {
        logger.error('Error sending message to SQS:', error as Error);
        throw error;
    }
}