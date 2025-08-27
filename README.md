# aws-developer-projects/README.md

# AWS Developer Projects

This repository contains a collection of mini-projects designed to help you learn and implement various AWS services using hands-on examples. Each mini-project focuses on a specific AWS service and provides practical implementations using the AWS SDK.

## Project Structure

```
aws-developer-projects
├── .gitignore
├── package.json
├── README.md
├── common
│   ├── utils
│   │   ├── aws-config.js
│   │   └── credentials.js
│   └── constants
│       └── index.js
├── s3-demo
│   ├── src
│   │   ├── cli
│   │   │   └── commands.js
│   │   └── sdk
│   │       └── operations.js
│   ├── package.json
│   └── README.md
├── dynamodb-demo
│   ├── src
│   │   ├── cli
│   │   │   └── commands.js
│   │   └── sdk
│   │       └── operations.js
│   ├── package.json
│   └── README.md
├── lambda-api-demo
│   ├── frontend
│   │   ├── src
│   │   ├── package.json
│   │   └── README.md
│   ├── backend
│   │   ├── src
│   │   ├── package.json
│   │   └── README.md
│   └── README.md
└── docs
    ├── s3.md
    ├── dynamodb.md
    └── lambda-api.md
```

## Mini-Projects Overview

### 1. S3 Demo
- **Description**: This mini-project demonstrates how to interact with Amazon S3 using the AWS SDK.
- **Folder**: `s3-demo`
- **Documentation**: See `s3-demo/README.md` for setup instructions and usage examples.

### 2. DynamoDB Demo
- **Description**: This mini-project showcases how to work with DynamoDB using the AWS SDK.
- **Folder**: `dynamodb-demo`
- **Documentation**: See `dynamodb-demo/README.md` for setup instructions and usage examples.

### 3. Lambda API Demo
- **Description**: This mini-project illustrates how to create a serverless API using AWS Lambda and API Gateway, with a React frontend.
- **Folder**: `lambda-api-demo`
- **Documentation**: See `lambda-api-demo/README.md` for setup instructions and usage examples.

## Common Utilities
The `common` folder contains utility functions and constants that can be reused across different mini-projects.

## Documentation
Detailed documentation for each mini-project can be found in the `docs` folder:
- `docs/s3.md`: S3 mini-project concepts and commands.
- `docs/dynamodb.md`: DynamoDB mini-project concepts and commands.
- `docs/lambda-api.md`: Lambda API mini-project concepts and commands.

## Getting Started
To get started with any of the mini-projects, navigate to the respective folder and follow the instructions in the README file. Make sure you have the AWS CLI configured and the necessary permissions to access the AWS services used in these projects.