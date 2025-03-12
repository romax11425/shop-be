import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

const awsRegion = process.env.AWS_REGION || 'eu-west-1';

export const handler = async (event: any) => {
    try {
        logger.info('Generating signed URL', event);

        const s3Client = new S3Client({ region: awsRegion });
        const fileName = event.queryStringParameters.name;

        logger.info('File name', fileName);

        if (!fileName) {
            logger.error('File name is required');
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify({ message: 'File name is required' }),
            };
        }

        const key = `uploaded/${fileName}`;
        const put = new PutObjectCommand({
            Bucket: 'romax114-import-service-bucket',
            Key: key,
            ContentType: 'text/csv',
        });

        logger.info('Generating signed URL for PUT', {put});

        const signedUrl = await getSignedUrl(s3Client, put, { expiresIn: 3600 });

        logger.info('Signed URL generated', signedUrl);
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Methods": "GET",
            },
            body: signedUrl,
        };   
    } catch (error) {
        logger.error('Error generating signed URL', error as Error);
        return {
            statusCode: 500,
            headers: {  
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Methods": "GET",
            },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}