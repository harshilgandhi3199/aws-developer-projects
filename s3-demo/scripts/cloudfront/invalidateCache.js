const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const cloudfront = new AWS.CloudFront();

const createInvalidation = async (distributionId, paths = ['/*']) => {
    try {
        console.log(` Creating cache invalidation for distribution: ${distributionId}`);
        console.log(` Paths to invalidate: ${paths.join(', ')}\n`);

        const invalidationParams = {
            DistributionId: distributionId,
            InvalidationBatch: {
                CallerReference: `invalidation-${Date.now()}`,
                Paths: {
                    Quantity: paths.length,
                    Items: paths
                }
            }
        };

        const result = await cloudfront.createInvalidation(invalidationParams).promise();
        
        console.log(' Cache invalidation created successfully!');
        console.log(` Invalidation ID: ${result.Invalidation.Id}`);
        console.log(` Status: ${result.Invalidation.Status}`);
        console.log(` Created: ${result.Invalidation.CreateTime}`);
        console.log(` Paths: ${result.Invalidation.InvalidationBatch.Paths.Items.join(', ')}`);
        
        console.log('\n Invalidation typically takes 10-15 minutes to complete');
        console.log(` Monitor status with: aws cloudfront get-invalidation --distribution-id ${distributionId} --id ${result.Invalidation.Id}`);

        return result.Invalidation;

    } catch (error) {
        console.error(' Error creating cache invalidation:', error.message);
        throw error;
    }
};

const listInvalidations = async (distributionId) => {
    try {
        console.log(` Listing invalidations for distribution: ${distributionId}\n`);

        const result = await cloudfront.listInvalidations({
            DistributionId: distributionId,
            MaxItems: '10'
        }).promise();

        if (result.InvalidationList.Items.length === 0) {
            console.log(' No invalidations found for this distribution');
            return [];
        }

        result.InvalidationList.Items.forEach((invalidation, index) => {
            console.log(`${index + 1}. Invalidation ID: ${invalidation.Id}`);
            console.log(`   Status: ${invalidation.Status}`);
            console.log(`   Created: ${invalidation.CreateTime}`);
            console.log(`   Paths: ${invalidation.InvalidationBatch.Paths.Items.join(', ')}`);
            console.log('   ' + '-'.repeat(50));
        });

        return result.InvalidationList.Items;

    } catch (error) {
        console.error(' Error listing invalidations:', error.message);
        throw error;
    }
};

const getInvalidationStatus = async (distributionId, invalidationId) => {
    try {
        const result = await cloudfront.getInvalidation({
            DistributionId: distributionId,
            Id: invalidationId
        }).promise();

        console.log(` Invalidation Status: ${result.Invalidation.Id}`);
        console.log(` Status: ${result.Invalidation.Status}`);
        console.log(` Created: ${result.Invalidation.CreateTime}`);
        console.log(` Paths: ${result.Invalidation.InvalidationBatch.Paths.Items.join(', ')}`);

        return result.Invalidation;

    } catch (error) {
        console.error(' Error getting invalidation status:', error.message);
        throw error;
    }
};

// Export functions
module.exports = {
    createInvalidation,
    listInvalidations,
    getInvalidationStatus
};

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'create' && args[1]) {
        const distributionId = args[1];
        const paths = args.slice(2).length > 0 ? args.slice(2) : ['/*'];
        createInvalidation(distributionId, paths);
    } else if (args[0] === 'list' && args[1]) {
        listInvalidations(args[1]);
    } else if (args[0] === 'status' && args[1] && args[2]) {
        getInvalidationStatus(args[1], args[2]);
    } else {
        console.log('Usage:');
        console.log('  node invalidateCache.js create <distribution-id> [paths...]  - Create invalidation');
        console.log('  node invalidateCache.js list <distribution-id>              - List invalidations');
        console.log('  node invalidateCache.js status <distribution-id> <inv-id>   - Get invalidation status');
        console.log('\nExamples:');
        console.log('  node invalidateCache.js create E1234567890 "/*"');
        console.log('  node invalidateCache.js create E1234567890 "/cache-test.html" "/styles/*"');
    }
}