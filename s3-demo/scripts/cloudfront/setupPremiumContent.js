const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();
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

const createPremiumContent = () => {
    const premiumDir = path.join(__dirname, '../../public/premium-content');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(premiumDir)) {
        fs.mkdirSync(premiumDir, { recursive: true });
    }

    // Create sample premium content files
    const premiumFiles = {
        'premium-video.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Video Content</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .premium-badge { background: gold; color: black; padding: 5px 15px; border-radius: 20px; }
        .video-container { background: #f0f0f0; padding: 40px; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🎬 Premium Video Content</h1>
    <span class="premium-badge">⭐ PREMIUM ONLY</span>
    
    <div class="video-container">
        <h2>🚀 Advanced AWS Tutorial Series</h2>
        <p>This exclusive content is only available to premium subscribers!</p>
        <p><strong>Access granted via CloudFront Signed URL</strong></p>
        <p>Generated at: ${new Date().toISOString()}</p>
    </div>
    
    <h3>What you'll learn:</h3>
    <ul>
        <li>Advanced CloudFront configurations</li>
        <li>Lambda@Edge implementations</li>
        <li>Real-time monitoring strategies</li>
        <li>Cost optimization techniques</li>
    </ul>
</body>
</html>`,

        'premium-document.pdf.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Document</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .document { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .watermark { color: #ccc; font-size: 12px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="document">
        <h1>📄 Premium AWS Architecture Guide</h1>
        <p><strong>🔒 CONFIDENTIAL CONTENT</strong></p>
        
        <h2>Executive Summary</h2>
        <p>This document contains proprietary AWS architecture patterns and cost optimization strategies developed through extensive enterprise experience.</p>
        
        <h2>Key Topics Covered</h2>
        <ul>
            <li>Multi-region disaster recovery patterns</li>
            <li>Advanced security configurations</li>
            <li>Enterprise-grade monitoring solutions</li>
            <li>Cost optimization at scale</li>
        </ul>
        
        <h2>Implementation Guidelines</h2>
        <p>Follow these step-by-step instructions to implement enterprise-grade AWS solutions...</p>
        
        <div class="watermark">
            Access via CloudFront Signed URL | Generated: ${new Date().toISOString()}
        </div>
    </div>
</body>
</html>`,

        'premium-software.zip.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Software Download</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; }
        .download-box { border: 2px solid #4CAF50; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .premium-only { background: linear-gradient(45deg, #FFD700, #FFA500); padding: 10px; border-radius: 5px; color: black; font-weight: bold; }
    </style>
</head>
<body>
    <h1>💻 Premium Software Package</h1>
    
    <div class="premium-only">
        🎯 PREMIUM SUBSCRIBERS ONLY
    </div>
    
    <div class="download-box">
        <h2>🚀 AWS DevOps Toolkit v2.0</h2>
        <p><strong>Package Size:</strong> 45.2 MB</p>
        <p><strong>Version:</strong> 2.0.1</p>
        <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h3>What's Included:</h3>
        <ul>
            <li>Automated deployment scripts</li>
            <li>Infrastructure as Code templates</li>
            <li>Monitoring dashboards</li>
            <li>Security scanning tools</li>
            <li>Cost optimization utilities</li>
        </ul>
        
        <p><strong>⚡ Download accessed via CloudFront Signed URL</strong></p>
        <p>This secure download link expires and cannot be shared.</p>
    </div>
</body>
</html>`
    };

    // Write files
    Object.entries(premiumFiles).forEach(([filename, content]) => {
        fs.writeFileSync(path.join(premiumDir, filename), content);
    });

    console.log(' Premium content files created');
    return premiumDir;
};

const uploadPremiumContent = async () => {
    try {
        const accountId = await getAccountId();
        const bucketName = `s3-demo-static-website-${accountId}`;
        
        console.log(' Creating premium content for CloudFront Signed URLs...\n');
        
        // Create premium content files
        const premiumDir = createPremiumContent();
        
        console.log('  Uploading premium content to S3...\n');

        const premiumFiles = [
            {
                local: 'premium-video.html',
                s3Key: 'premium/video/advanced-aws-course.html',
                contentType: 'text/html'
            },
            {
                local: 'premium-document.pdf.html',
                s3Key: 'premium/documents/aws-architecture-guide.html',
                contentType: 'text/html'
            },
            {
                local: 'premium-software.zip.html',
                s3Key: 'premium/downloads/aws-devops-toolkit.html',
                contentType: 'text/html'
            }
        ];

        const uploadResults = [];

        for (const file of premiumFiles) {
            const filePath = path.join(premiumDir, file.local);
            const fileContent = fs.readFileSync(filePath);

            const uploadParams = {
                Bucket: bucketName,
                Key: file.s3Key,
                Body: fileContent,
                ContentType: file.contentType,
                CacheControl: 'private, max-age=0, no-cache, no-store, must-revalidate', // No caching for premium content
                Metadata: {
                    'content-type': 'premium',
                    'access-level': 'signed-url-only',
                    'upload-time': new Date().toISOString()
                }
            };

            const result = await s3.upload(uploadParams).promise();
            console.log(` Uploaded: ${file.s3Key}`);
            console.log(`   Type: Premium content (requires signed URL)`);
            console.log(`   Location: ${result.Location}\n`);

            uploadResults.push({
                key: file.s3Key,
                etag: result.ETag,
                location: result.Location,
                type: 'premium'
            });
        }

        console.log(' Premium content uploaded successfully!');
        console.log(' These files are now ready for CloudFront Signed URL access');
        
        return uploadResults;

    } catch (error) {
        console.error(' Error uploading premium content:', error.message);
        throw error;
    }
};

// Export
module.exports = {
    uploadPremiumContent,
    createPremiumContent
};

// Run if called directly
if (require.main === module) {
    uploadPremiumContent();
}