import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { productsData } from '../mock/product';
import { Product } from '../model/product';
import { Stock } from '../model/stock';

const client = new DynamoDBClient({ region: 'eu-central-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

async function populateTables(): Promise<void> {
    try {

        const products: Product[] = [];
        const stocks: Stock[] = [];

        for (const productData of productsData) {
            const id = randomUUID();
            products.push({ id, ...productData });
            stocks.push({ 
                product_id: id, 
                count: Math.floor(Math.random() * 100) + 1 
            });
        }

        for (const product of products) {
            await dynamodb.send(new PutCommand({
                TableName: 'Products',
                Item: product
            }));
        }

        for (const stock of stocks) {
            await dynamodb.send(new PutCommand({
                TableName: 'Stocks',
                Item: stock
            }));
        }

    } catch (error) {
        console.error('Error populating tables:', error);
        throw error;
    }
}

populateTables()
    .then(() => console.log('Script completed successfully.'))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });