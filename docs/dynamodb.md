# DynamoDB Mini-Project Documentation

## Overview
This document provides an overview of the DynamoDB mini-project, including setup instructions, key concepts, and commands for interacting with DynamoDB using the AWS SDK.

## Key Concepts
- **DynamoDB**: A fully managed NoSQL database service that provides fast and predictable performance with seamless scalability.
- **Tables**: The primary structure in DynamoDB where data is stored. Each table has a primary key that uniquely identifies each item.
- **Items**: The individual records in a table, similar to rows in a relational database.
- **Attributes**: The data fields in an item, similar to columns in a relational database.

## Setup Instructions
1. **Install Dependencies**: Navigate to the `dynamodb-demo` directory and run the following command to install the necessary dependencies:
   ```
   npm install
   ```

2. **Configure AWS Credentials**: Ensure that your AWS credentials are set up correctly. You can do this by creating a `credentials.js` file in the `common/utils` directory or by using environment variables.

3. **Create a DynamoDB Table**: Use the AWS CLI or SDK to create a DynamoDB table. For example, you can create a table named `MyTable` with a primary key `id`:
   ```javascript
   // Example command to create a table using AWS CLI
   aws dynamodb create-table --table-name MyTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST
   ```

## Commands
The following commands are available in the CLI for interacting with DynamoDB:

- **Create Item**: Add a new item to the DynamoDB table.
- **Get Item**: Retrieve an item from the DynamoDB table using its primary key.
- **Update Item**: Modify an existing item in the DynamoDB table.
- **Delete Item**: Remove an item from the DynamoDB table.

Refer to the `commands.js` file in the `src/cli` directory for implementation details.

## Conclusion
This mini-project serves as a practical introduction to using DynamoDB with the AWS SDK. Follow the setup instructions and utilize the provided commands to interact with your DynamoDB tables effectively.