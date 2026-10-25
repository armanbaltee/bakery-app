import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config';

const client = new DynamoDBClient({
  region: config.region,
  ...(config.dynamoEndpoint ? { endpoint: config.dynamoEndpoint } : {}),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAME = config.tableName;

export async function getItem<T = any>(pk: string, sk = 'METADATA'): Promise<T | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    })
  );
  return (result.Item as T) || null;
}

export async function putItem<T extends Record<string, any>>(item: T): Promise<T> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
  return item;
}

export async function deleteItem(pk: string, sk = 'METADATA'): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    })
  );
}

export async function queryByPK<T = any>(pk: string, skBeginsWith?: string): Promise<T[]> {
  const params: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression: skBeginsWith ? 'PK = :pk AND begins_with(SK, :sk)' : 'PK = :pk',
    ExpressionAttributeValues: skBeginsWith ? { ':pk': pk, ':sk': skBeginsWith } : { ':pk': pk },
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as T[]) || [];
}

export async function queryGSI<T = any>(
  gsi1pk: string,
  gsi1skBeginsWith?: string,
  indexName = 'GSI1'
): Promise<T[]> {
  const params: any = {
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: gsi1skBeginsWith
      ? 'GSI1PK = :gpk AND begins_with(GSI1SK, :gsk)'
      : 'GSI1PK = :gpk',
    ExpressionAttributeValues: gsi1skBeginsWith
      ? { ':gpk': gsi1pk, ':gsk': gsi1skBeginsWith }
      : { ':gpk': gsi1pk },
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as T[]) || [];
}

export async function scanItems<T = any>(
  filterExpression?: string,
  expressionValues?: Record<string, any>,
  expressionNames?: Record<string, string>
): Promise<T[]> {
  const params: any = {
    TableName: TABLE_NAME,
    ...(filterExpression ? { FilterExpression: filterExpression } : {}),
    ...(expressionValues ? { ExpressionAttributeValues: expressionValues } : {}),
    ...(expressionNames ? { ExpressionAttributeNames: expressionNames } : {}),
  };

  const result = await docClient.send(new ScanCommand(params));
  return (result.Items as T[]) || [];
}
