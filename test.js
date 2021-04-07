"use strict";

const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const endpoint = "http://localhost:4566";

const lambda = new LambdaClient({ endpoint });

lambda
  .send(new InvokeCommand({ FunctionName: "aws-nodejs-local-queueMessage" }))
  .then((data) => {
    console.log("res", data);
  })
  .catch((err) => console.error(err));
