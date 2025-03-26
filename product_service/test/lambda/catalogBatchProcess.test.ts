import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
import { SQSEvent } from 'aws-lambda';

const { handler: catalogBatchProcess } = require("../../lambda/catalogBatchProcess");

const mockDB = mockClient(DynamoDBDocumentClient);
const mockSNS = mockClient(SNSClient);

const mockDataRecord: SQSEvent['Records'][number] = {
  body: JSON.stringify({
    id: '1asd9fsadf',
    title: 'some product',
    description: 'some product description',
    price: 1000,
    count: 50,
  }),
  messageId: '1333',
  receiptHandle: 'sisakfjsdlf',
  attributes: {
    ApproximateReceiveCount: '1',
    SentTimestamp: '999999999',
    SenderId: 'XXXX',
    ApproximateFirstReceiveTimestamp: '9999999',
  },
  messageAttributes: {
    count: { dataType: 'Number', stringValue: '99' },
  },
  md5OfBody: 'test-md5',
  eventSource: 'aws:sqs',
  eventSourceARN: 'test:arn',
  awsRegion: 'us-west-1',
};

const mockInvalidDataRecord: SQSEvent['Records'][number] = {
  ...mockDataRecord,
  body: JSON.stringify({
    id: '',
    title: false,
    price: 'xx',
    count: 5,
  }),
  messageId: '2',
};

describe('catalogBatchProcess', () => {
  beforeEach(() => {
    mockDB.reset();
    mockSNS.reset();
  });

  it('processes valid product data, saves it in DynamoDB and sends SNS message', async () => {
    mockDB.on(TransactWriteCommand).resolves({});

    mockSNS.on(PublishCommand).resolves({ MessageId: '1234' });

    const event: SQSEvent = {
      Records: [mockDataRecord],
    };

    await catalogBatchProcess(event);

    expect(mockDB.calls()).toHaveLength(1);
    expect(
      mockDB.commandCalls(TransactWriteCommand)[0].args[0].input.TransactItems
    ).toHaveLength(2);
    expect(mockSNS.calls()).toHaveLength(1);
  });

  it('rejects invalid product data and skips DynamoDB and SNS interaction', async () => {
    const event: SQSEvent = {
      Records: [mockInvalidDataRecord],
    };

    mockDB.on(TransactWriteCommand).resolves({});
    mockSNS.on(PublishCommand).resolves({});

    await catalogBatchProcess(event);

    expect(mockDB.calls()).toHaveLength(0);
    expect(mockSNS.calls()).toHaveLength(0);
  });

  it('handles SNS errors', async () => {
    mockDB.on(TransactWriteCommand).resolves({});
    mockSNS.on(PublishCommand).rejects(new Error('sns error'));

    const event: SQSEvent = {
      Records: [mockDataRecord],
    };

    await expect(catalogBatchProcess(event)).resolves.not.toThrow();

    expect(mockDB.calls()).toHaveLength(1);
    expect(mockSNS.calls()).toHaveLength(1);
  });

  it('handles DynamoDB transaction errors', async () => {
    mockDB.on(TransactWriteCommand).rejects(new Error('transaction failed'));

    const event: SQSEvent = {
      Records: [mockDataRecord],
    };

    await expect(catalogBatchProcess(event)).resolves.not.toThrow();

    expect(mockDB.calls()).toHaveLength(1);
    expect(mockSNS.calls()).toHaveLength(0);
  });
});
