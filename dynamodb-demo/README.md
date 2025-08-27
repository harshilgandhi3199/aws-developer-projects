# dynamodb-demo/README.md

# DynamoDB Demo Project

This project demonstrates how to interact with Amazon DynamoDB using the AWS SDK. It includes command-line interface (CLI) commands and SDK operations for performing various actions on DynamoDB.

## Overview

The DynamoDB demo project provides a simple way to create, read, update, and delete items in a DynamoDB table. It is designed to help you understand how to use the AWS SDK for JavaScript to manage DynamoDB resources programmatically.

## Prerequisites

- Node.js installed on your machine
- AWS account with DynamoDB access
- AWS CLI configured with your credentials

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/aws-developer-projects.git
   cd aws-developer-projects/dynamodb-demo
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Configure your AWS credentials in `common/utils/credentials.js` or set them as environment variables.

## Usage

You can run the CLI commands to interact with DynamoDB. For example:

```bash
node src/cli/commands.js create-item --tableName YourTableName --item '{"id": "1", "name": "Sample Item"}'
```

Refer to the documentation in the `docs/dynamodb.md` file for more detailed commands and examples.

## License

This project is licensed under the MIT License. See the LICENSE file for more information.