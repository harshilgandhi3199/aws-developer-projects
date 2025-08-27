const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sts = new AWS.STS();
AWS.config.update({ region: 'us-east-1' });

const getAccountId = async () => {
    try {
        const data = await sts.getCallerIdentity({}).promise();
        return data.Account;
    } catch (error) {
        console.error('Error getting account ID:', error);
        throw error;
    }
};

const corsConfiguration = {
    CORSRules: [
        {
            AllowedOrigins: ['http://localhost:3000'],
            AllowedMethods: ['GET'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
        }
    ]
};

const setCorsPolicy = async () => {

    // Get bucket name
    const accountId = await getAccountId();
    const bucketName = `s3-demo-static-website-${accountId}`;

    try {
        await s3.putBucketCors({
            Bucket: bucketName,
            CORSConfiguration: corsConfiguration
        }).promise();
        console.log(`CORS policy applied to bucket: ${bucketName}`);
    } catch (error) {
        console.error('Error applying CORS policy:', error);
    }
};

setCorsPolicy();