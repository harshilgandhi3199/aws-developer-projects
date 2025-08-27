# lambda-api.md

# Lambda API Demo

This document provides an overview of the Lambda API demo project, which demonstrates how to create a serverless API using AWS Lambda and API Gateway. The project consists of a Node.js backend and a React frontend.

## Project Structure

The Lambda API demo project is organized as follows:

```
lambda-api-demo
├── frontend
│   ├── src
│   ├── package.json
│   └── README.md
└── backend
    ├── src
    ├── package.json
    └── README.md
```

## Backend

The backend is built using Node.js and AWS Lambda. It handles API requests and interacts with other AWS services as needed.

### Key Features

- Serverless architecture using AWS Lambda
- API Gateway for routing requests
- Integration with AWS services (e.g., DynamoDB, S3)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd aws-developer-projects/lambda-api-demo/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Deploy the Lambda function**:
   Use the AWS CLI or SAM CLI to deploy the function to AWS.

## Frontend

The frontend is a React application that communicates with the backend API.

### Key Features

- Single Page Application (SPA)
- User-friendly interface for interacting with the API

### Setup Instructions

1. **Navigate to the frontend directory**:
   ```bash
   cd aws-developer-projects/lambda-api-demo/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## Conclusion

This Lambda API demo project serves as a practical example of building serverless applications on AWS. It showcases the integration of various AWS services and provides a foundation for further exploration and development.