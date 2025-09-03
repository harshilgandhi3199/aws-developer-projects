const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer');

const loadKeyConfig = () => {
    try {
        const configPath = path.join(__dirname, '../../keys/cloudfront-config.json');
        
        if (!fs.existsSync(configPath)) {
            throw new Error('Key configuration not found. Run createTrustedKeyGroup.js first.');
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Load private key
        if (!fs.existsSync(config.privateKeyPath)) {
            throw new Error(`Private key file not found: ${config.privateKeyPath}`);
        }
        
        config.privateKey = fs.readFileSync(config.privateKeyPath, 'utf8');
        return config;
        
    } catch (error) {
        console.error('Error loading key config:', error.message);
        throw error;
    }
};

const generateSignedURL = (url, options = {}) => {
    try {
        const config = loadKeyConfig();
        
        // Default options
        const {
            expiresIn = 3600, // 1 hour in seconds
            ipAddress = null,
            dateGreaterThan = null
        } = options;

        // Calculate expiration time
        const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;

        // Create policy statement
        const policy = {
            Statement: [
                {
                    Resource: url,
                    Condition: {
                        DateLessThan: {
                            'AWS:EpochTime': expirationTime
                        }
                    }
                }
            ]
        };

        // Add IP restriction if specified
        if (ipAddress) {
            policy.Statement[0].Condition.IpAddress = {
                'AWS:SourceIp': ipAddress
            };
        }

        // Add date greater than if specified
        if (dateGreaterThan) {
            policy.Statement[0].Condition.DateGreaterThan = {
                'AWS:EpochTime': Math.floor(dateGreaterThan.getTime() / 1000)
            };
        }

        // Convert policy to base64
        const policyString = JSON.stringify(policy);
        const policyBase64 = Buffer.from(policyString).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        // Create signature
        const signature = crypto.sign('RSA-SHA1', Buffer.from(policyString), config.privateKey);

        const signatureBase64 = signature.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        // Construct signed URL
        const separator = url.includes('?') ? '&' : '?';
        const signedURL = `${url}${separator}Policy=${policyBase64}&Signature=${signatureBase64}&Key-Pair-Id=${config.publicKeyId}`;

        return {
            signedURL,
            expiresAt: new Date(expirationTime * 1000),
            policy: policy,
            keyPairId: config.publicKeyId
        };

    } catch (error) {
        console.error('Error generating signed URL:', error.message);
        throw error;
    }
};

const generateCannedSignedURL = (url, expiresIn = 3600) => {
    try {
        const config = loadKeyConfig();
        const dateLessThan = new Date(Date.now() + expiresIn * 1000);
        
        const signedUrl = getSignedUrl({
            url,
            keyPairId: config.publicKeyId,
            privateKey: config.privateKey,
            dateLessThan
        });

        return {
            signedURL: signedUrl,
            expiresAt: dateLessThan,
            keyPairId: config.publicKeyId,
            type: 'canned'
        };

    } catch (error) {
        console.error('Error generating canned signed URL:', error.message);
        throw error;
    }
};

const demonstrateSignedURLs = async () => {
    try {
        console.log(' CloudFront Signed URLs with Trusted Key Groups Demo\n');

        // Get distribution domain (you'll need to update this)
        const distributionDomain = 'd2n24dqnpdzn6v.cloudfront.net'; // Update with your domain
        
        const premiumContent = [
            {
                path: 'premium/video/advanced-aws-course.html',
                description: ' Premium Video Course',
                type: 'video'
            },
            {
                path: 'premium/documents/aws-architecture-guide.html',
                description: ' Premium Architecture Guide',
                type: 'document'
            },
            {
                path: 'premium/downloads/aws-devops-toolkit.html',
                description: ' Premium Software Download',
                type: 'software'
            }
        ];

        console.log('📋 Generating signed URLs for premium content...\n');

        for (const content of premiumContent) {
            const baseURL = `https://${distributionDomain}/${content.path}`;
            
            console.log(`${content.description}:`);
            console.log(`    Original URL: ${baseURL}`);
            
            // Generate different types of signed URLs
            
            // 1. Standard signed URL (1 hour)
            const standard = generateCannedSignedURL(baseURL, 3600);
            console.log(`    1-Hour Access: ${standard.signedURL}`);
            console.log(`    Expires: ${standard.expiresAt.toLocaleString()}`);
            
            // 2. Short-term signed URL (15 minutes)
            const shortTerm = generateCannedSignedURL(baseURL, 900);
            console.log(`    15-Min Access: ${shortTerm.signedURL}`);
            
            // 3. Custom policy with IP restriction (if needed)
            const withIP = generateSignedURL(baseURL, {
                expiresIn: 7200, // 2 hours
                ipAddress: '203.0.113.0/24' // Example IP range
            });
            console.log(`    IP-Restricted: ${withIP.signedURL}`);
            
            console.log('   ' + '-'.repeat(80));
        }

        console.log('\n How to test:');
        console.log('1. Copy any signed URL above');
        console.log('2. Paste it in your browser');
        console.log('3. You should see the premium content');
        console.log('4. Try accessing the original URL - should get 403 Forbidden');
        
        console.log('\n  Security Notes:');
        console.log('• Signed URLs expire automatically');
        console.log('• Cannot be modified without invalidating signature');
        console.log('• Private key must be kept secure');
        console.log('• Each URL is unique and time-limited');

        return premiumContent.map(content => ({
            path: content.path,
            signedURL: generateCannedSignedURL(`https://${distributionDomain}/${content.path}`, 3600)
        }));

    } catch (error) {
        console.error(' Error demonstrating signed URLs:', error.message);
        throw error;
    }
};


// Export
module.exports = {
    generateSignedURL,
    generateCannedSignedURL,
    demonstrateSignedURLs,
    loadKeyConfig
};

// Run if called directly
if (require.main === module) {
    demonstrateSignedURLs();
}