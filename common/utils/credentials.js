module.exports = {
    getAWSCredentials: function() {
        return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'your-access-key-id',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'your-secret-access-key',
            region: process.env.AWS_REGION || 'your-region'
        };
    }
};