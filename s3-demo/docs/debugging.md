# Debugging Notes for S3 Static Website Deployment

This document outlines the issues encountered during the deployment of the S3 static website, along with their explanations and the steps taken to resolve them.

---

## **1. AWS SDK Warning**
### **Issue:**
The following warning was displayed:
> "The AWS SDK for JavaScript (v2) is in maintenance mode."

### **Explanation:**
The project uses AWS SDK v2, which is in maintenance mode. AWS recommends migrating to AWS SDK v3 for new projects.

### **Fix:**
No immediate action was taken since the SDK v2 is still functional. However, migrating to AWS SDK v3 is recommended for future updates.

---

## **2. BucketAlreadyExists Error**
### **Issue:**
The following error occurred:
> "The requested bucket name is not available. The bucket namespace is shared by all users of the system."

### **Explanation:**
S3 bucket names are globally unique across all AWS accounts. The bucket name `s3-demo-static-website` was already in use by another AWS account.

### **Fix:**
The bucket name was updated to include the AWS account ID dynamically:
```javascript
BUCKET_NAME = `${BUCKET_NAME}-${accountId}`;
```

---

## **3. AccessDenied During File Upload**
### **Issue:**
The following error occurred:
> "AccessDenied: Access Denied."

### **Explanation:**
The IAM user did not have sufficient permissions to upload files to the S3 bucket.

### **Fix:**
The IAM user was granted the necessary permissions by attaching the following policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:PutObject",
                "s3:PutBucketPolicy",
                "s3:PutBucketWebsite",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::s3-demo-static-website-<account-id>",
                "arn:aws:s3:::s3-demo-static-website-<account-id>/*"
            ]
        }
    ]
}
```

---

## **4. Region Undefined in Website URL**
### **Issue:**
The website URL displayed `undefined` for the region:
> "http://s3-demo-static-website.s3-website-undefined.amazonaws.com."

### **Explanation:**
The AWS SDK did not inherit the region from the CLI configuration.

### **Fix:**
The region was explicitly set in the script:
```javascript
AWS.config.update({ region: 'us-east-1' });
```

---

## **5. Block Public Access Prevented Bucket Policy**
### **Issue:**
The bucket policy was not applied because the bucket had **Block Public Access** settings enabled.

### **Explanation:**
The **Block Public Access** settings override bucket policies, preventing public access to the bucket.

### **Fix:**
The **Block Public Access** settings were disabled using the AWS Management Console and the following CLI command:
```bash
aws s3api put-bucket-public-access-block \
    --bucket s3-demo-static-website-<account-id> \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

---

## **6. Bucket Policy Not Applied**
### **Issue:**
The bucket policy was not applied because the `createBucket` function skipped the bucket creation step when the bucket already existed.

### **Explanation:**
The `createBucket` function checked if the bucket existed and skipped the entire bucket creation process, including the bucket policy step.

### **Fix:**
The `createBucket` function was updated to ensure the bucket policy is applied even if the bucket already exists:
```javascript
if (error.code === 'NotFound') {
    // Create the bucket
    await s3.createBucket({ Bucket: BUCKET_NAME }).promise();
} else {
    console.log(`Bucket "${BUCKET_NAME}" already exists.`);
}

// Apply bucket policy
const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [{
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
    }]
};

await s3.putBucketPolicy({
    Bucket: BUCKET_NAME,
    Policy: JSON.stringify(bucketPolicy)
}).promise();
```

---

## **7. AccessControlListNotSupported Error**
### **Issue:**
The following error occurred during file uploads:
> "AccessControlListNotSupported: The bucket does not allow ACLs."

### **Explanation:**
The bucket had **Object Ownership** set to `BucketOwnerEnforced`, which disables the use of ACLs.

### **Fix:**
The `ACL` parameter was removed from the `putObject` calls:
```javascript
await s3.putObject({
    Bucket: BUCKET_NAME,
    Key: bucketPath,
    Body: fileContent,
    ContentType: contentType
}).promise();
```

---

## **8. 403 Forbidden When Accessing Website**
### **Issue:**
Accessing the website URL resulted in a `403 Forbidden` error.

### **Explanation:**
The objects in the bucket were not publicly accessible due to missing bucket policies or incorrect permissions.

### **Fix:**
The bucket policy was applied to allow public access:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::s3-demo-static-website-<account-id>/*"
        }
    ]
}
```

---

## **Conclusion**
All issues have been resolved, and the S3 static website is now accessible at:
```plaintext
http://s3-demo-static-website-<account-id>.s3-website-us-east-1.amazonaws.com
```

Future deployments should work seamlessly with the updated script and configuration.