# Serverless LocalStack (SQS, SNS, S3, DynamoDB)

- [serverless-localstack](https://github.com/localstack/serverless-localstack) 0.4.0
- [localstack](https://github.com/localstack/localstack) 0.12.9

## Summary

- pros
  - supports a lot of aws services
  - single source of all aws data, all aws-sdk clients are configured in the same way
  - seamless integration with other services (check the trigger chain in the example, lambda fn (send sqs) -> sqs fn (publish sns) -> sns fn (put in dynamodb))
  - not possible to use lambda optimization `mountCode: true`, it just doesn't work with that stack tested
  - works with serverless offline (but again only if `mountCode: false` and with cloudside plugin)
  - large community
- cons
  - requires global external dependencies (python, pip, localstack, docker)
  - not stable when deploying fns iteratively (sometimes the same deploy may fail, sometimes it succeed), seems work ok for the clean startup
  - no watch mode (possible to integrate with serverless offline)
  - may be hard to apply for existing project with complex serverless config
  - issues with typescript plugin (serverless-webpack could be used instead, but requires manual setup)

# Serverless Offline SQS

- [serverless-offline-sqs](https://github.com/CoorpAcademy/serverless-plugins/tree/master/packages/serverless-offline-sqs) 4.1.1
- [elasticmq](https://github.com/softwaremill/elasticmq) 1.1.0

## Summary

- pros
  - easy setup
  - built in watch mode (provided by serverless offline)
- cons
  - requires external dependency (java, elasticmq-server)
  - may be challenging to integrate with other offline plugins ([sns](https://github.com/CoorpAcademy/serverless-plugins/issues/156), s3, dynamodb), needs multiple services running ([dynamodb-local](https://github.com/99x/serverless-dynamodb-local), [Minio](https://github.com/minio/minio))
  - small community
