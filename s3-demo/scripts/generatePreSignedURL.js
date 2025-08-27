const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();
const sts = new AWS.STS();

const getAccountId = async () => {
    try {
        const data = await sts.getCallerIdentity({}).promise();
        return data.Account;
    } catch (error) {
        console.error('Error getting account ID:', error);
        throw error;
    }
};

const generatePresignedUrl = async (bucketName, objectKey, expiresInSeconds) => {
    try {
        const url = await s3.getSignedUrlPromise('getObject', {
            Bucket: bucketName,
            Key: objectKey,
            Expires: expiresInSeconds // URL expiration time in seconds
        });

        console.log(`Pre-signed URL for ${objectKey}: ${url}`);
        return url;
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw error;
    }
};

(async () => {
    const accountId = await getAccountId();
    const bucketName = `s3-demo-static-website-${accountId}`;
    const objectKey = 'index.html';
    const expiresInSeconds = 3600; // 1 hour

    await generatePresignedUrl(bucketName, objectKey, expiresInSeconds);
})();