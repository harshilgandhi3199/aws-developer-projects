const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({ region: 'us-east-1' });

const cloudfront = new AWS.CloudFront();
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

const findDistribution = async () => {
    try {
        const result = await cloudfront.listDistributions().promise();
        const accountId = await getAccountId();
        const expectedBucketName = `s3-demo-static-website-${accountId}`;

        const distribution = result.DistributionList.Items.find(dist => 
            dist.Origins.Items.some(origin => 
                origin.DomainName.includes(expectedBucketName)
            )
        );

        if (!distribution) {
            throw new Error('S3 Demo distribution not found');
        }

        return distribution;
    } catch (error) {
        console.error('Error finding distribution:', error.message);
        throw error;
    }
};

const loadKeyGroupConfig = () => {
    try {
        const configPath = path.join(__dirname, '../../keys/cloudfront-config.json');
        
        if (!fs.existsSync(configPath)) {
            throw new Error('Key group configuration not found. Run createTrustedKeyGroup.js first.');
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config;
    } catch (error) {
        console.error('Error loading key group config:', error.message);
        throw error;
    }
};

const updateDistributionWithKeyGroup = async () => {
    try {
        console.log(' Adding trusted key group for premium content only...\n');

        const keyConfig = loadKeyGroupConfig();
        console.log(` Using Key Group: ${keyConfig.keyGroupId}`);

        const distribution = await findDistribution();
        console.log(` Found distribution: ${distribution.Id}`);

        const currentConfig = await cloudfront.getDistribution({ Id: distribution.Id }).promise();
        const config = currentConfig.Distribution.DistributionConfig;

        console.log('🔧 Configuring cache behaviors...');

        // Keep default behavior PUBLIC (no signed URLs required)
        config.DefaultCacheBehavior.TrustedKeyGroups = {
            Enabled: false,
            Quantity: 0,
            Items: []
        };

        config.DefaultCacheBehavior.TrustedSigners = {
            Enabled: false,
            Quantity: 0,
            Items: []
        };

        // Add SmoothStreaming if missing
        if (config.DefaultCacheBehavior.SmoothStreaming === undefined) {
            config.DefaultCacheBehavior.SmoothStreaming = false;
        }

        // Initialize CacheBehaviors if not exists
        if (!config.CacheBehaviors) {
            config.CacheBehaviors = {
                Quantity: 0,
                Items: []
            };
        }

        // Check if premium/* behavior exists
        const premiumBehaviorIndex = config.CacheBehaviors.Items.findIndex(
            behavior => behavior.PathPattern === 'premium/*'
        );

        if (premiumBehaviorIndex === -1) {
            // Create new premium cache behavior
            console.log(' Creating premium/* cache behavior...');
            
            const premiumCacheBehavior = {
                PathPattern: 'premium/*',
                TargetOriginId: config.Origins.Items[0].Id,
                ViewerProtocolPolicy: 'redirect-to-https',
                Compress: true,
                SmoothStreaming: false,
                FieldLevelEncryptionId: '',
                TrustedKeyGroups: {
                    Enabled: true,
                    Quantity: 1,
                    Items: [keyConfig.keyGroupId]
                },
                TrustedSigners: {
                    Enabled: false,
                    Quantity: 0,
                    Items: []
                },
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD']
                    }
                },
                LambdaFunctionAssociations: {
                    Quantity: 0,
                    Items: []
                }
            };

            // Use cache policy if available, otherwise use legacy settings
            if (config.DefaultCacheBehavior.CachePolicyId) {
                premiumCacheBehavior.CachePolicyId = config.DefaultCacheBehavior.CachePolicyId;
            } else {
                premiumCacheBehavior.ForwardedValues = {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0, Items: [] }
                };
                premiumCacheBehavior.MinTTL = 0;
                premiumCacheBehavior.DefaultTTL = 3600; // 1 hour
                premiumCacheBehavior.MaxTTL = 86400;    // 1 day
            }

            config.CacheBehaviors.Items.push(premiumCacheBehavior);
            config.CacheBehaviors.Quantity = config.CacheBehaviors.Items.length;
        } else {
            // Update existing premium behavior
            console.log('🔄 Updating existing premium/* cache behavior...');
            
            const existingBehavior = config.CacheBehaviors.Items[premiumBehaviorIndex];
            
            // Add missing fields
            if (existingBehavior.SmoothStreaming === undefined) {
                existingBehavior.SmoothStreaming = false;
            }
            
            // Enable trusted key groups
            existingBehavior.TrustedKeyGroups = {
                Enabled: true,
                Quantity: 1,
                Items: [keyConfig.keyGroupId]
            };
            
            existingBehavior.TrustedSigners = {
                Enabled: false,
                Quantity: 0,
                Items: []
            };

            // Add missing LambdaFunctionAssociations
            if (!existingBehavior.LambdaFunctionAssociations) {
                existingBehavior.LambdaFunctionAssociations = {
                    Quantity: 0,
                    Items: []
                };
            }
        }

        // Update other existing cache behaviors (keep them public)
        config.CacheBehaviors.Items.forEach(behavior => {
            if (behavior.PathPattern !== 'premium/*') {
                if (behavior.SmoothStreaming === undefined) {
                    behavior.SmoothStreaming = false;
                }
                behavior.TrustedKeyGroups = {
                    Enabled: false,
                    Quantity: 0,
                    Items: []
                };
                behavior.TrustedSigners = {
                    Enabled: false,
                    Quantity: 0,
                    Items: []
                };
                // Add missing LambdaFunctionAssociations
                if (!behavior.LambdaFunctionAssociations) {
                    behavior.LambdaFunctionAssociations = {
                        Quantity: 0,
                        Items: []
                    };
                }
            }
        });

        // Update the distribution
        const updateParams = {
            Id: distribution.Id,
            DistributionConfig: config,
            IfMatch: currentConfig.ETag
        };

        console.log('⏳ Applying configuration changes...');
        const result = await cloudfront.updateDistribution(updateParams).promise();

        console.log(' Distribution updated successfully!');
        console.log(` Distribution ID: ${result.Distribution.Id}`);
        console.log(` Domain: ${result.Distribution.DomainName}`);
        console.log(` Key Group: ${keyConfig.keyGroupId}`);
        console.log(` Status: ${result.Distribution.Status}`);
        
        console.log('\n Cache Behavior Summary:');
        console.log('   • Default (*):  PUBLIC ACCESS');
        console.log('   • premium/*:  REQUIRES SIGNED URLs');
        
        console.log('\n Deployment Time: 15-20 minutes');
        console.log(' After deployment, test:');
        console.log('   1. Regular content: Should work normally');
        console.log('   2. Premium content: Should require signed URLs');

        return {
            distributionId: result.Distribution.Id,
            domainName: result.Distribution.DomainName,
            keyGroupId: keyConfig.keyGroupId,
            status: result.Distribution.Status
        };

    } catch (error) {
        console.error(' Error updating distribution:', error.message);
        
        if (error.code === 'InvalidArgument') {
            console.log('\🔍 Troubleshooting tips:');
            console.log('• Ensure distribution is in "Deployed" status');
            console.log('• Verify key group ID is valid');
            console.log('• Check that premium content exists in S3');
        }
        
        throw error;
    }
};

// Export
module.exports = {
    updateDistributionWithKeyGroup,
    loadKeyGroupConfig,
    findDistribution
};

// Run if called directly
if (require.main === module) {
    updateDistributionWithKeyGroup();
}