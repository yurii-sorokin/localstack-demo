import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { APIGatewayEvent, SNSEvent, SQSEvent } from "aws-lambda";
import safeStringify from "fast-safe-stringify";
import { nanoid } from "nanoid";
import { Readable } from "stream";
import { inspect } from "util";

const hostname = process.env.LOCALSTACK_HOSTNAME || "localhost";
const endpoint = `http://${hostname}:4566`;

const snsClient = new SNSClient({ endpoint });
const sqsClient = new SQSClient({ endpoint });
const dynamoClient = new DynamoDBClient({ endpoint });
const s3Client = new S3Client({ endpoint, forcePathStyle: true });

const logger = {
  info: (...args: unknown[]) =>
    console.log(...args.map((arg) => inspect(arg, true, null, true))),
  error: (...args: unknown[]) => console.error(...args),
};

const res = () => {
  return {
    json: <T extends unknown>(body: T) => ({
      body: safeStringify(body),
    }),
  };
};

export const receiveMessage = async (event: SNSEvent) => {
  const { Message: message = "None", TopicArn: topic } =
    event.Records?.[0]?.Sns || {};

  logger.info({ endpoint, topic, message });
  logger.info({ records: event.Records });

  try {
    const output = await dynamoClient.send(
      new PutItemCommand({
        TableName: "messages",
        Item: { id: { S: nanoid() }, message: { S: message } },
      })
    );
    logger.info({ output });
    return res().json({ message: `Hello, ${message}!` });
  } catch (error) {
    logger.info("Unable to store message");
    logger.error(error);
    return res().json({});
  }
};

export const receiveQueue = async (event: SQSEvent) => {
  const { body = "None" } = event.Records?.[0] || {};
  const topic = process.env.TEST_TOPIC;
  logger.info({ endpoint, topic, message: body });
  logger.info({ records: event.Records });
  try {
    const output = await snsClient.send(
      new PublishCommand({ TopicArn: topic, Message: body })
    );
    logger.info({ output });
    return res().json(output);
  } catch (error) {
    logger.info("Unable to publish SNS message");
    logger.error(error);
    return res().json({});
  }
};

export const queueMessage = async (event: APIGatewayEvent) => {
  const { body = "None" } = event.queryStringParameters || {};
  const url = process.env.TEST_QUEUE_URL;
  logger.info({ endpoint, url, body });
  try {
    const output = await sqsClient.send(
      new SendMessageCommand({ QueueUrl: url, MessageBody: body })
    );
    logger.info({ output });
    return res().json(output);
  } catch (error) {
    logger.info("Unable to send SQS message");
    logger.error(error);
    return res().json({});
  }
};

export const store = async (event: APIGatewayEvent) => {
  const { body = "None", key = "test" } = event.queryStringParameters || {};
  const bucket = process.env.TEST_BUCKET;
  logger.info({ endpoint, bucket, body });
  try {
    const output = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Readable.from([body]),
      })
    );
    logger.info({ output });
    return res().json(output);
  } catch (error) {
    logger.info("Unable to save an object to bucket");
    logger.error(error);
    return res().json({});
  }
};

export const restore = async (event: APIGatewayEvent) => {
  const { body = "None", key = "test" } = event.queryStringParameters || {};
  const bucket = process.env.TEST_BUCKET;

  function streamToString(stream: Readable) {
    const chunks: Buffer[] = [];
    return new Promise<string>((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  }

  logger.info({ endpoint, bucket, body });
  try {
    const output = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    const Body = await streamToString(output.Body as any);
    logger.info({ output: { ...output, Body } });
    return res().json({ ...output, Body });
  } catch (error) {
    logger.info("Unable to get an object from bucket");
    logger.error(error);
    return res().json({});
  }
};
