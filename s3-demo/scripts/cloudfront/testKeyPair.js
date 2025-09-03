// Create a test file: testKeyPair.js
const crypto = require('crypto');
const fs = require('fs');

const testKeyPair = () => {
    try {
        // Load your private key
        const privateKey = fs.readFileSync('keys/cloudfront-private-key-converted.pem', 'utf8');
        const publicKey = fs.readFileSync('keys/cloudfront-public-key.pem', 'utf8');
        
        // Test data
        const testData = 'Hello CloudFront';
        
        // Sign with private key
        const signature = crypto.sign('RSA-SHA1', Buffer.from(testData), privateKey);
        
        // Verify with public key
        const isValid = crypto.verify('RSA-SHA1', Buffer.from(testData), publicKey, signature);
        
        console.log('Key pair test result:', isValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isValid) {
            console.log('❌ Your private and public keys do not match!');
            console.log('   You need to regenerate the CloudFront public key.');
        }
        
    } catch (error) {
        console.error('Error testing key pair:', error.message);
    }
};

testKeyPair();