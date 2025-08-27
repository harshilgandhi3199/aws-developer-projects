const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
        {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::s3-demo-static-website-*/*` // Use a wildcard for dynamic bucket names
        }
    ]
};

module.exports = bucketPolicy;