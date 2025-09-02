const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const cloudfront = new AWS.CloudFront();
const sts = new AWS.STS();
const s3 = new AWS.S3();

const getAccountId = async () => {
    try {
        const data = await sts.getCallerIdentity({}).promise();
        return data.Account;
    } catch (error) {
        console.error('Error getting account ID:', error);
        throw error;
    }
};

const createOriginAccessControl = async () => {
    try {
        // Fixed parameter structure for AWS SDK v2
        const oacConfig = {
            OriginAccessControlConfig: {
                Name: `s3-demo-oac-${Date.now()}`,
                Description: 'Origin Access Control for S3 Demo CloudFront Distribution',
                SigningBehavior: 'always',
                SigningProtocol: 'sigv4',
                OriginAccessControlOriginType: 's3'
            }
        };

        const result = await cloudfront.createOriginAccessControl(oacConfig).promise();
        console.log(` Created Origin Access Control: ${result.OriginAccessControl.Id}`);
        return result.OriginAccessControl.Id;
    } catch (error) {
        console.error(' Error creating Origin Access Control:', error.message);
        throw error;
    }
};

const createCachePolicy = async () => {
    try {
        const cachePolicyConfig = {
            CachePolicyConfig: {
                Name: `s3-demo-cache-policy-${Date.now()}`,
                Comment: 'Custom cache policy for S3 demo - 1 hour TTL',
                DefaultTTL: 3600, // 1 hour
                MaxTTL: 86400,    // 1 day
                MinTTL: 0,        // No minimum
                ParametersInCacheKeyAndForwardedToOrigin: {
                    EnableAcceptEncodingGzip: true,
                    EnableAcceptEncodingBrotli: true,
                    QueryStringsConfig: {
                        QueryStringBehavior: 'none' // Don't include query strings in cache key
                    },
                    HeadersConfig: {
                        HeaderBehavior: 'none' // Don't include headers in cache key
                    },
                    CookiesConfig: {
                        CookieBehavior: 'none' // Don't include cookies in cache key
                    }
                }
            }
        };

        const result = await cloudfront.createCachePolicy(cachePolicyConfig).promise();
        console.log(` Created Cache Policy: ${result.CachePolicy.Id}`);
        return result.CachePolicy.Id;
    } catch (error) {
        console.error(' Error creating cache policy:', error.message);
        console.log('  Using managed cache policy instead...');
        // If policy creation fails, we'll use a managed policy
        return '658327ea-f89d-4fab-a63d-7e88639e58f6'; // Managed-CachingOptimized
    }
};

const updateBucketPolicy = async (bucketName, oacId) => {
    try {
        const accountId = await getAccountId();
        const bucketPolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowCloudFrontServicePrincipal',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudfront.amazonaws.com'
                    },
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${bucketName}/*`,
                    Condition: {
                        StringEquals: {
                            'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/*`
                        }
                    }
                }
            ]
        };

        await s3.putBucketPolicy({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy)
        }).promise();

        console.log(` Updated bucket policy for CloudFront access: ${bucketName}`);
    } catch (error) {
        console.error(' Error updating bucket policy:', error.message);
        throw error;
    }
};

const createCloudFrontDistribution = async () => {
    try {
        const accountId = await getAccountId();
        const bucketName = `s3-demo-static-website-${accountId}`;
        const bucketDomain = `${bucketName}.s3.amazonaws.com`;

        console.log(' Creating CloudFront Distribution...\n');

        // Create Origin Access Control
        console.log(' Creating Origin Access Control...');
        const oacId = await createOriginAccessControl();

        // Create custom cache policy
        console.log(' Creating Cache Policy...');
        const cachePolicyId = await createCachePolicy();

        // Update S3 bucket policy
        console.log('  Updating S3 bucket policy...');
        await updateBucketPolicy(bucketName, oacId);

        console.log(' Creating CloudFront distribution...');
        const distributionConfig = {
            DistributionConfig: {
                CallerReference: `s3-demo-${Date.now()}`,
                Comment: 'S3 Demo CloudFront Distribution with 1hr cache',
                DefaultRootObject: 'index.html',
                Enabled: true,
                PriceClass: 'PriceClass_100', // Use only North America and Europe (free tier friendly)
                
                Origins: {
                    Quantity: 1,
                    Items: [
                        {
                            Id: 'S3-Origin',
                            DomainName: bucketDomain,
                            S3OriginConfig: {
                                OriginAccessIdentity: '' // Empty for OAC
                            },
                            OriginAccessControlId: oacId
                        }
                    ]
                },

                DefaultCacheBehavior: {
                    TargetOriginId: 'S3-Origin',
                    ViewerProtocolPolicy: 'redirect-to-https',
                    CachePolicyId: cachePolicyId,
                    Compress: true,
                    AllowedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD'],
                        CachedMethods: {
                            Quantity: 2,
                            Items: ['GET', 'HEAD']
                        }
                    }
                }
            }
        };

        const result = await cloudfront.createDistribution(distributionConfig).promise();
        
        console.log('\n CloudFront Distribution Created Successfully!');
        console.log(` Distribution ID: ${result.Distribution.Id}`);
        console.log(` Domain Name: ${result.Distribution.DomainName}`);
        console.log(` Status: ${result.Distribution.Status}`);
        console.log(` Cache Policy: Custom 1-hour TTL`);
        console.log(` Origin Access Control: ${oacId}`);
        
        console.log('\n  Note: Distribution deployment takes 15-20 minutes');
        console.log(` Test URL: https://${result.Distribution.DomainName}`);

        return {
            distributionId: result.Distribution.Id,
            domainName: result.Distribution.DomainName,
            oacId: oacId,
            cachePolicyId: cachePolicyId
        };

    } catch (error) {
        console.error(' Error creating CloudFront distribution:', error.message);
        throw error;
    }
};

// Export for use in other scripts
module.exports = {
    createCloudFrontDistribution,
    getAccountId
};

// Run if called directly
if (require.main === module) {
    createCloudFrontDistribution();
}