const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const createBucket = async (bucketName) => {
    const params = {
        Bucket: bucketName,
        ACL: 'public-read',
    };
    try {
        const data = await s3.createBucket(params).promise();
        console.log(`Bucket created successfully: ${data.Location}`);
    } catch (error) {
        console.error(`Error creating bucket: ${error.message}`);
    }
};

const uploadFile = async (bucketName, fileName, fileContent) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
    };
    try {
        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully: ${data.Location}`);
    } catch (error) {
        console.error(`Error uploading file: ${error.message}`);
    }
};

const listBuckets = async () => {
    try {
        const data = await s3.listBuckets().promise();
        console.log('Buckets:');
        data.Buckets.forEach((bucket) => {
            console.log(` - ${bucket.Name}`);
        });
    } catch (error) {
        console.error(`Error listing buckets: ${error.message}`);
    }
};

module.exports = {
    createBucket,
    uploadFile,
    listBuckets,
};