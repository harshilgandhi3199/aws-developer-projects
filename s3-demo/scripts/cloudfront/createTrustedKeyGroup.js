const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

AWS.config.update({ region: 'us-east-1' });

const cloudfront = new AWS.CloudFront();

const generateRSAKeyPair = () => {
    console.log(' Generating RSA key pair for CloudFront Signed URLs...\n');
    
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Save keys to files
    const keysDir = path.join(__dirname, '../../keys');
    if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
    }

    const privateKeyPath = path.join(keysDir, 'cloudfront-private-key.pem');
    const publicKeyPath = path.join(keysDir, 'cloudfront-public-key.pem');

    fs.writeFileSync(privateKeyPath, keyPair.privateKey);
    fs.writeFileSync(publicKeyPath, keyPair.publicKey);

    console.log(' RSA key pair generated:');
    console.log(`   Private key: ${privateKeyPath}`);
    console.log(`   Public key: ${publicKeyPath}\n`);

    return {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        privateKeyPath,
        publicKeyPath
    };
};

const createPublicKey = async (publicKeyPem) => {
    try {
        console.log(' Creating CloudFront Public Key...');

        const publicKeyConfig = {
            PublicKeyConfig: {
                CallerReference: `s3-demo-public-key-${Date.now()}`,
                Name: `s3-demo-public-key-${Date.now()}`,
                Comment: 'Public key for S3 Demo CloudFront Signed URLs',
                EncodedKey: publicKeyPem
            }
        };

        const result = await cloudfront.createPublicKey(publicKeyConfig).promise();
        
        console.log(` Public Key created: ${result.PublicKey.Id}`);
        console.log(`   ETag: ${result.ETag}\n`);

        return result.PublicKey.Id;

    } catch (error) {
        console.error(' Error creating public key:', error.message);
        throw error;
    }
};

const createKeyGroup = async (publicKeyId) => {
    try {
        console.log(' Creating Trusted Key Group...');

        const keyGroupConfig = {
            KeyGroupConfig: {
                Name: `s3-demo-key-group-${Date.now()}`,
                Comment: 'Trusted key group for S3 Demo CloudFront Signed URLs',
                Items: [publicKeyId]
            }
        };

        const result = await cloudfront.createKeyGroup(keyGroupConfig).promise();
        
        console.log(` Key Group created: ${result.KeyGroup.Id}`);
        console.log(`   ETag: ${result.ETag}\n`);

        return result.KeyGroup.Id;

    } catch (error) {
        console.error(' Error creating key group:', error.message);
        throw error;
    }
};

const createTrustedKeyGroupSetup = async () => {
    try {
        console.log(' Setting up Trusted Key Group for CloudFront Signed URLs...\n');

        // Step 1: Generate RSA key pair
        const keyPair = generateRSAKeyPair();

        // Step 2: Create CloudFront public key
        const publicKeyId = await createPublicKey(keyPair.publicKey);

        // Step 3: Create trusted key group
        const keyGroupId = await createKeyGroup(publicKeyId);

        // Step 4: Save configuration
        const configPath = path.join(__dirname, '../../keys/cloudfront-config.json');
        const config = {
            keyGroupId,
            publicKeyId,
            privateKeyPath: keyPair.privateKeyPath,
            publicKeyPath: keyPair.publicKeyPath,
            createdAt: new Date().toISOString()
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        console.log(' Trusted Key Group setup complete!');
        console.log(' Configuration saved to:', configPath);
        console.log('\n Next steps:');
        console.log('1. Update your CloudFront distribution to use this key group');
        console.log('2. Use the configuration for generating signed URLs');
        console.log('\n Keep your private key secure and never commit it to version control!');

        return config;

    } catch (error) {
        console.error(' Error setting up trusted key group:', error.message);
        throw error;
    }
};

// Export
module.exports = {
    createTrustedKeyGroupSetup,
    generateRSAKeyPair,
    createPublicKey,
    createKeyGroup
};

// Run if called directly
if (require.main === module) {
    createTrustedKeyGroupSetup();
}