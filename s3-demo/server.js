const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');

const app = express();
const PORT = 3000;

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const sts = new AWS.STS();

// Helper function to get account ID
const getAccountId = async () => {
    try {
        const data = await sts.getCallerIdentity({}).promise();
        return data.Account;
    } catch (error) {
        console.error('Error getting account ID:', error);
        throw error;
    }
};

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get S3 details
app.get('/api/s3-details', async (req, res) => {
    try {
        const accountId = await getAccountId();
        const objectKey = 'sse-s3/encryption-test.txt'; // Or any object you want to test with
        
        res.json({
            accountId: accountId,
            objectKey: objectKey,
            bucketName: `s3-demo-static-website-${accountId}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get S3 details' });
    }
});

// API endpoint to list available objects (optional)
app.get('/api/s3-objects', async (req, res) => {
    try {
        const accountId = await getAccountId();
        const bucketName = `s3-demo-static-website-${accountId}`;
        
        const s3 = new AWS.S3();
        const result = await s3.listObjectsV2({
            Bucket: bucketName,
            MaxKeys: 10 // Limit to first 10 objects
        }).promise();
        
        const objects = result.Contents.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified
        }));
        
        res.json({
            bucketName: bucketName,
            objects: objects
        });
    } catch (error) {
        console.error('Error listing objects:', error);
        res.status(500).json({ error: 'Failed to list S3 objects' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET /api/s3-details - Get account ID and object key`);
    console.log(`  GET /api/s3-objects - List available S3 objects`);
});