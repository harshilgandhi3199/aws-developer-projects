# S3 Demo Project README

# S3 Demo Project

This project demonstrates how to interact with Amazon S3 using the AWS SDK for JavaScript. It includes command-line interface (CLI) commands and SDK operations for managing S3 buckets and objects.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [License](#license)

## Prerequisites

- Node.js (version 14.x or later)
- AWS Account
- AWS CLI configured with appropriate permissions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aws-developer-projects.git
   cd aws-developer-projects/s3-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

You can use the CLI commands to interact with S3. For example, to list all buckets, run:

```bash
node src/cli/commands.js listBuckets
```

## Commands

- `listBuckets`: Lists all S3 buckets in your account.
- `createBucket <bucketName>`: Creates a new S3 bucket with the specified name.
- `uploadFile <bucketName> <filePath>`: Uploads a file to the specified S3 bucket.
- `downloadFile <bucketName> <fileName>`: Downloads a file from the specified S3 bucket.

## License

This project is licensed under the MIT License.