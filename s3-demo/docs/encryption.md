# S3 Encryption Methods Demo

This document explains the four different encryption methods available in Amazon S3, with practical examples from our demonstration script.

---

## Overview

Amazon S3 provides multiple ways to encrypt your data to ensure security and compliance. Here are the four main encryption methods:

1. **Server-Side Encryption with S3-Managed Keys (SSE-S3)**
2. **Server-Side Encryption with KMS Keys (SSE-KMS)**
3. **Server-Side Encryption with Customer-Provided Keys (SSE-C)**
4. **Client-Side Encryption**

---

## 1. Server-Side Encryption with S3-Managed Keys (SSE-S3)

### What is it?
SSE-S3 is the simplest encryption method where Amazon S3 automatically manages all the encryption keys for you.

### How it works:
- S3 creates and manages unique encryption keys for each object
- S3 encrypts your data using AES-256 encryption
- The encryption key itself is encrypted with a master key that S3 rotates regularly
- Everything happens automatically - you just need to specify the encryption type

### When to use:
- You want encryption but don't want to manage keys
- Simple compliance requirements
- Default choice for most use cases

### Code Example:
javascript
await s3.putObject({
    Bucket: bucketName,
    Key: 'my-file.txt',
    Body: fileContent,
    ServerSideEncryption: 'AES256'  // This enables SSE-S3
}).promise();

## 2. Server-Side Encryption with KMS Keys (SSE-KMS)

### What is it?
SSE-KMS uses AWS Key Management Service (KMS) to manage encryption keys, providing more control and audit capabilities.

### How it works:
- AWS KMS creates and manages the encryption keys
- You can use AWS-managed keys or create your own customer-managed keys
- Provides detailed audit logs of key usage via CloudTrail
- Supports key rotation and fine-grained access control

### When to use:
- You need detailed audit logs of who accessed your data
- Compliance requirements mandate key management controls
- You want to control which users/roles can decrypt data
- You need key rotation capabilities

### Code example:
await s3.putObject({
    Bucket: bucketName,
    Key: 'my-file.txt',
    Body: fileContent,
    ServerSideEncryption: 'aws:kms'  // Uses default AWS-managed key
    // SSEKMSKeyId: 'your-key-id'    // Optional: use your own key
}).

## 3. Server-Side Encryption with Customer-Provided Keys (SSE-C)

### What is it?
SSE-C lets you provide your own encryption keys while S3 handles the encryption/decryption process.

### How it works:
- You generate and manage your own 256-bit encryption keys
- You provide the key with each request (upload/download)
- S3 uses your key to encrypt/decrypt the data
- S3 does NOT store your key - you must provide it every time
- You're responsible for key management and storage

### When to use:
- You want full control over encryption keys
- Your organization has specific key management requirements
- You don't want AWS to have any access to your keys
- Regulatory requirements mandate customer-controlled keys


### Code Example:
const encryptionKey = crypto.randomBytes(32);  // Generate 256-bit key
const keyMD5 = crypto.createHash('md5').update(encryptionKey).digest('base64');

await s3.putObject({
    Bucket: bucketName,
    Key: 'my-file.txt',
    Body: fileContent,
    SSECustomerAlgorithm: 'AES256',
    SSECustomerKey: encryptionKey,        // Your encryption key
    SSECustomerKeyMD5: keyMD5            // MD5 hash for verification
}).promise();
// You must save the key separately for later retrieval!

### Important Notes:
- You MUST save the encryption key - if you lose it, your data is gone forever
- You need to provide the same key for every download request
- S3 discards the key after processing your request

## 4. Client-Side Encryption

### What is it?
Client-side encryption means you encrypt the data on your local machine before uploading it to S3.

### How it works:
- You encrypt the file using your own encryption algorithm and keys
- You upload the already-encrypted data to S3
- S3 stores the encrypted data without knowing how to decrypt it
- You decrypt the data after downloading it from S3


### When to use:
- Maximum security - you want to encrypt data before it leaves your environment
- Zero-trust architecture requirements
- You want complete control over the encryption process
- Sensitive data that should never exist unencrypted in the cloud

### Code Example:
// Encrypt the data before upload
const encryptionKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);

let encryptedContent = cipher.update(fileContent);
encryptedContent = Buffer.concat([encryptedContent, cipher.final()]);

// Upload encrypted data
await s3.putObject({
    Bucket: bucketName,
    Key: 'my-file.txt',
    Body: encryptedContent,  // Already encrypted!
    Metadata: {
        'encryption-algorithm': 'aes-256-cbc',
        'encrypted-by': 'client'
    }
}).promise();

// Save keys for later decryption

### Important Notes:
- You handle everything - encryption, key management, decryption
- S3 has no knowledge of your encryption
- Can be combined with server-side encryption for defense-in-depth
- You're responsible for secure key storage and management




