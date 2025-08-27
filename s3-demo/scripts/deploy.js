const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();
const sts = new AWS.STS();


let BUCKET_NAME = 's3-demo-static-website';

const getAccountId = async () => {
    try {
        const data = await sts.getCallerIdentity({}).promise();
        return data.Account;
    } catch (error) {
        console.error('Error getting account ID:', error);
        throw error;
    }
};

const createBucket = async () => {
    try {
        // Check if the bucket already exists
        await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
        console.log(`Bucket "${BUCKET_NAME}" already exists. Skipping creation.`);
    } catch (error) {
        if (error.code === 'NotFound') {
            // Bucket does not exist, so create it
            console.log(`Bucket "${BUCKET_NAME}" does not exist. Creating...`);
            await s3.createBucket({
                Bucket: BUCKET_NAME
            }).promise();

            console.log(`Bucket "${BUCKET_NAME}" created.`);
        } else {
            console.error('Error checking or creating bucket:', error);
            throw error;
        }
    }

    // Enable static website hosting
    await s3.putBucketWebsite({
        Bucket: BUCKET_NAME,
        WebsiteConfiguration: {
            IndexDocument: {
                Suffix: 'index.html'
            },
            ErrorDocument: {
                Key: 'index.html'
            }
        }
    }).promise();
    console.log(`Static website hosting enabled for "${BUCKET_NAME}".`);

    // Enable bucket versioning
    try {
        await s3.putBucketVersioning({
            Bucket: BUCKET_NAME,
            VersioningConfiguration: {
                Status: 'Enabled'
            }
        }).promise();
        console.log(`Versioning enabled for bucket "${BUCKET_NAME}".`);
    } catch (error) {
        console.error(`Error enabling versioning for bucket "${BUCKET_NAME}":`, error);
        throw error;
    }

    // Set bucket policy for public access
    const bucketPolicy = require('./bucketPolicy');

    try {
        bucketPolicy.Statement[0].Resource = `arn:aws:s3:::${BUCKET_NAME}/*`; // Update the resource ARN with the dynamic bucket name
        await s3.putBucketPolicy({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(bucketPolicy)
        }).promise();
        console.log(`Bucket policy applied to "${BUCKET_NAME}".`);
    } catch (error) {
        console.error(`Error applying bucket policy to "${BUCKET_NAME}":`, error);
        throw error;
    }
};

const uploadFile = async (filePath, bucketPath) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        const contentType = mime.lookup(filePath) || 'application/octet-stream';

        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: bucketPath,
            Body: fileContent,
            ContentType: contentType
        }).promise();

        console.log(`Uploaded: ${bucketPath}`);
    } catch (error) {
        console.error(`Error uploading ${bucketPath}:`, error);
    }
};

const deployWebsite = async () => {
    try {
        // Fetch AWS account ID and append it to the bucket name
        const accountId = await getAccountId();
        BUCKET_NAME = `${BUCKET_NAME}-${accountId}`; // Append account ID to the bucket name

        const buildPath = path.join(__dirname, '../buna-beans-static/build');

        // Create bucket and configure it
        await createBucket();

        // Upload files recursively
        const uploadDir = async (dirPath, baseDir) => {
            const files = fs.readdirSync(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    await uploadDir(filePath, baseDir);
                } else {
                    const bucketPath = path.relative(baseDir, filePath);
                    await uploadFile(filePath, bucketPath);
                }
            }
        };

        await uploadDir(buildPath, buildPath);

        console.log(`\nWebsite deployed successfully!`);
        console.log(`Website URL: http://${BUCKET_NAME}.s3-website-${AWS.config.region}.amazonaws.com`);
    } catch (error) {
        console.error('Error deploying website:', error);
    }
};

deployWebsite();