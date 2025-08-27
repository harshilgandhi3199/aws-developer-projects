module.exports = {
    region: 'us-east-1', // Specify your AWS region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Load from environment variable
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Load from environment variable
    s3: {
        bucketName: 'your-s3-bucket-name', // Replace with your S3 bucket name
    },
    dynamoDB: {
        tableName: 'your-dynamodb-table-name', // Replace with your DynamoDB table name
    },
    // Add other AWS service configurations as needed
};