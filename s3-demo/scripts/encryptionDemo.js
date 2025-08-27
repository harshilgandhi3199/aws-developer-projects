const AWS = require('aws-sdk');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

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

// 1. Server-Side Encryption with S3-Managed Keys (SSE-S3)
const uploadWithSSES3 = async (bucketName, objectKey, filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        
        const result = await s3.putObject({
            Bucket: bucketName,
            Key: `sse-s3/${objectKey}`,
            Body: fileContent,
            ServerSideEncryption: 'AES256'
        }).promise();

        console.log(`   SSE-S3: Uploaded ${objectKey} with S3-managed encryption`);
        console.log(`   ETag: ${result.ETag}`);
        console.log(`   Encryption: ${result.ServerSideEncryption}\n`);
        
        return `sse-s3/${objectKey}`;
    } catch (error) {
        console.error('Error uploading with SSE-S3:', error.message);
        return null;
    }
};

// 2. Server-Side Encryption with KMS Keys (SSE-KMS)
const uploadWithSSEKMS = async (bucketName, objectKey, filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        
        const result = await s3.putObject({
            Bucket: bucketName,
            Key: `sse-kms/${objectKey}`,
            Body: fileContent,
            ServerSideEncryption: 'aws:kms',
        }).promise();

        console.log(`   SSE-KMS: Uploaded ${objectKey} with AWS-managed KMS key`);
        console.log(`   ETag: ${result.ETag}`);
        console.log(`   Encryption: ${result.ServerSideEncryption}`);
        console.log(`   KMS Key ID: ${result.SSEKMSKeyId}\n`);
        
        return `sse-kms/${objectKey}`;
    } catch (error) {
        console.error('Error uploading with SSE-KMS:', error.message);
        return null;
    }
};

// 3. Server-Side Encryption with Customer-Provided Keys (SSE-C)
const uploadWithSSEC = async (bucketName, objectKey, filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        
        // Generate a 256-bit (32-byte) encryption key
        const encryptionKey = crypto.randomBytes(32);
        const keyMD5 = crypto.createHash('md5').update(encryptionKey).digest('base64');
        
        const result = await s3.putObject({
            Bucket: bucketName,
            Key: `sse-c/${objectKey}`,
            Body: fileContent,
            SSECustomerAlgorithm: 'AES256',
            SSECustomerKey: encryptionKey,
            SSECustomerKeyMD5: keyMD5
        }).promise();

        console.log(`   SSE-C: Uploaded ${objectKey} with customer-provided key`);
        console.log(`   ETag: ${result.ETag}`);
        console.log(`   Encryption: ${result.SSECustomerAlgorithm}`);
        console.log(`   Key MD5: ${result.SSECustomerKeyMD5}`);
        
        // Save the key for later retrieval
        const keyData = {
            key: encryptionKey.toString('base64'),
            keyMD5: keyMD5,
            algorithm: 'AES256'
        };
        fs.writeFileSync(`${objectKey}.sse-c.key`, JSON.stringify(keyData, null, 2));
        console.log(`   Key saved to: ${objectKey}.sse-c.key\n`);
        
        return { objectKey: `sse-c/${objectKey}`, keyData };
    } catch (error) {
        console.error('Error uploading with SSE-C:', error.message);
        return null;
    }
};

// 4. Client-Side Encryption
const uploadWithClientSideEncryption = async (bucketName, objectKey, filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        
        // Generate encryption key and IV
        const encryptionKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        // Encrypt the file content
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        let encryptedContent = cipher.update(fileContent);
        encryptedContent = Buffer.concat([encryptedContent, cipher.final()]);
        
        const result = await s3.putObject({
            Bucket: bucketName,
            Key: `client-side/${objectKey}`,
            Body: encryptedContent,
            Metadata: {
                'encryption-algorithm': 'aes-256-cbc',
                'encrypted-by': 'client',
                'original-size': fileContent.length.toString()
            }
        }).promise();

        console.log(`   Client-Side: Uploaded ${objectKey} with client-side encryption`);
        console.log(`   ETag: ${result.ETag}`);
        console.log(`   Original Size: ${fileContent.length} bytes`);
        console.log(`   Encrypted Size: ${encryptedContent.length} bytes`);
        
        // Save the key for later decryption
        const keyData = {
            key: encryptionKey.toString('base64'),
            iv: iv.toString('base64'),
            algorithm: 'aes-256-cbc'
        };
        fs.writeFileSync(`${objectKey}.client.key`, JSON.stringify(keyData, null, 2));
        console.log(`   Key saved to: ${objectKey}.client.key\n`);
        
        return { objectKey: `client-side/${objectKey}`, keyData };
    } catch (error) {
        console.error('Error uploading with client-side encryption:', error.message);
        return null;
    }
};

// Verification Functions

// Verify SSE-S3 encryption
const verifySSES3 = async (bucketName, objectKey) => {
    try {
        const result = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();

        console.log(`   SSE-S3 Verification: Successfully retrieved ${objectKey}`);
        console.log(`   Server-Side Encryption: ${result.ServerSideEncryption || 'Not specified'}`);
        console.log(`   Content Length: ${result.ContentLength} bytes\n`);
        
        return true;
    } catch (error) {
        console.error(` Error verifying SSE-S3 for ${objectKey}:`, error.message);
        return false;
    }
};

// Verify SSE-KMS encryption
const verifySSEKMS = async (bucketName, objectKey) => {
    try {
        const result = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();

        console.log(`   SSE-KMS Verification: Successfully retrieved ${objectKey}`);
        console.log(`   Server-Side Encryption: ${result.ServerSideEncryption || 'Not specified'}`);
        console.log(`   KMS Key ID: ${result.SSEKMSKeyId || 'Not specified'}`);
        console.log(`   Content Length: ${result.ContentLength} bytes\n`);
        
        return true;
    } catch (error) {
        console.error(` Error verifying SSE-KMS for ${objectKey}:`, error.message);
        return false;
    }
};

// Verify SSE-C encryption
const verifySSEC = async (bucketName, objectKey, keyData) => {
    try {
        const result = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey,
            SSECustomerAlgorithm: keyData.algorithm,
            SSECustomerKey: Buffer.from(keyData.key, 'base64'),
            SSECustomerKeyMD5: keyData.keyMD5
        }).promise();

        console.log(`   SSE-C Verification: Successfully retrieved ${objectKey}`);
        console.log(`   Customer Algorithm: ${result.SSECustomerAlgorithm || 'Not specified'}`);
        console.log(`   Customer Key MD5: ${result.SSECustomerKeyMD5 || 'Not specified'}`);
        console.log(`   Content Length: ${result.ContentLength} bytes\n`);
        
        return true;
    } catch (error) {
        console.error(`Error verifying SSE-C for ${objectKey}:`, error.message);
        return false;
    }
};

// Verify client-side encryption
const verifyClientSideEncryption = async (bucketName, objectKey, keyData) => {
    try {
        const result = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();

        console.log(`   Client-Side Verification: Successfully retrieved encrypted ${objectKey}`);
        console.log(`   Metadata - Algorithm: ${result.Metadata['encryption-algorithm'] || 'Not specified'}`);
        console.log(`   Metadata - Encrypted By: ${result.Metadata['encrypted-by'] || 'Not specified'}`);
        console.log(`   Encrypted Content Length: ${result.ContentLength} bytes`);
        
        // Decrypt the content
        const encryptedContent = result.Body;
        const key = Buffer.from(keyData.key, 'base64');
        const iv = Buffer.from(keyData.iv, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decryptedContent = decipher.update(encryptedContent);
        decryptedContent = Buffer.concat([decryptedContent, decipher.final()]);
        
        console.log(`   Decrypted Content Length: ${decryptedContent.length} bytes`);
        console.log(`   Decryption: SUCCESS\n`);
        
        return true;
    } catch (error) {
        console.error(`Error verifying client-side encryption for ${objectKey}:`, error.message);
        return false;
    }
};

// Main demonstration function
const demonstrateEncryption = async () => {
    try {
        console.log('S3 Encryption Methods Demonstration\n');
        console.log('=' .repeat(50));
        
       // Create test file content directly
       const testContent = `# S3 Encryption Test File

       This is a test file to demonstrate different S3 encryption methods:
       - Server-Side Encryption with S3-Managed Keys (SSE-S3)
       - Server-Side Encryption with KMS Keys (SSE-KMS)
       - Server-Side Encryption with Customer-Provided Keys (SSE-C)
       - Client-Side Encryption
       
       Generated at: ${new Date().toISOString()}
       Random data: ${Math.random().toString(36).substring(7)}
       `;
       
        // Create the test file
        const testFilePath = path.join(__dirname, 'encryption-test.txt');
        fs.writeFileSync(testFilePath, testContent);
        console.log(`Created test file: ${testFilePath}\n`);
        
        const objectKey = 'encryption-test.txt';
        
        // Get bucket name
        const accountId = await getAccountId();
        const bucketName = `s3-demo-static-website-${accountId}`;
        
        console.log(`\nUsing bucket: ${bucketName}`);
        console.log(`Using test file: ${path.basename(testFilePath)}\n`);
        
        // Upload with different encryption methods
        console.log('UPLOADING WITH DIFFERENT ENCRYPTION METHODS');
        console.log('-'.repeat(50));
        
        const ssES3Result = await uploadWithSSES3(bucketName, objectKey, testFilePath);
        const sseKMSResult = await uploadWithSSEKMS(bucketName, objectKey, testFilePath);
        const sseCResult = await uploadWithSSEC(bucketName, objectKey, testFilePath);
        const clientSideResult = await uploadWithClientSideEncryption(bucketName, objectKey, testFilePath);
        
        // Verify encryption methods
        console.log('VERIFYING ENCRYPTION METHODS');
        console.log('-'.repeat(50));

        const results = {
            sseS3:false,
            sseKMS: false,
            sseC: false,
            clientSide: false
        }
        
        if (ssES3Result) {
            results.sseS3 = await verifySSES3(bucketName, ssES3Result);
        }
        
        if (sseKMSResult) {
            results.sseKMS = await verifySSEKMS(bucketName, sseKMSResult);
        }
        
        if (sseCResult) {
            results.sseC = await verifySSEC(bucketName, sseCResult.objectKey, sseCResult.keyData);
        }
        
        if (clientSideResult) {
            results.clientSide = await verifyClientSideEncryption(bucketName, clientSideResult.objectKey, clientSideResult.keyData);
        }
        
        console.log('SUMMARY');
        console.log('-'.repeat(50));
        const successCount = Object.values(results).filter(Boolean).length;
        const totalMethods = 4;

        if (successCount === totalMethods) {
            console.log('  All encryption methods demonstrated and verified successfully!');
        } else {
            console.log(`  ${totalMethods - successCount} encryption method(s) failed. Check the errors above.`);
        }
        
    } catch (error) {
        console.error('Error in demonstration:', error);
    }
};

// Export functions for use in other scripts
module.exports = {
    uploadWithSSES3,
    uploadWithSSEKMS,
    uploadWithSSEC,
    uploadWithClientSideEncryption,
    verifySSES3,
    verifySSEKMS,
    verifySSEC,
    verifyClientSideEncryption,
    demonstrateEncryption
};

// Run the demonstration if this file is executed directly
if (require.main === module) {
    demonstrateEncryption();
}