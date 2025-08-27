const { listBuckets, createBucket, deleteBucket } = require('../sdk/operations');

const commands = {
    list: async () => {
        try {
            const buckets = await listBuckets();
            console.log('Buckets:', buckets);
        } catch (error) {
            console.error('Error listing buckets:', error);
        }
    },
    create: async (bucketName) => {
        try {
            await createBucket(bucketName);
            console.log(`Bucket "${bucketName}" created successfully.`);
        } catch (error) {
            console.error('Error creating bucket:', error);
        }
    },
    delete: async (bucketName) => {
        try {
            await deleteBucket(bucketName);
            console.log(`Bucket "${bucketName}" deleted successfully.`);
        } catch (error) {
            console.error('Error deleting bucket:', error);
        }
    }
};

module.exports = commands;