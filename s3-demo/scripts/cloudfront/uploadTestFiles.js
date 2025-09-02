const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

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

const getCacheControlForFile = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Cache control rules based on file type
    const cacheRules = {
        // HTML files - short cache (1 hour)
        '.html': 'max-age=3600, public',
        '.htm': 'max-age=3600, public',
        
        // CSS and JS files - medium cache (1 day)
        '.css': 'max-age=86400, public',
        '.js': 'max-age=86400, public',
        '.mjs': 'max-age=86400, public',
        
        // Images - long cache (1 week)
        '.svg': 'max-age=604800, public',
        '.png': 'max-age=604800, public',
        '.jpg': 'max-age=604800, public',
        '.jpeg': 'max-age=604800, public',
        '.gif': 'max-age=604800, public',
        '.webp': 'max-age=604800, public',
        '.ico': 'max-age=604800, public',
        
        // Fonts - long cache (1 week)
        '.woff': 'max-age=604800, public',
        '.woff2': 'max-age=604800, public',
        '.ttf': 'max-age=604800, public',
        '.eot': 'max-age=604800, public',
        
        // JSON files - medium cache (1 day)
        '.json': 'max-age=86400, public',
        
        // Text files - short cache (1 hour)
        '.txt': 'max-age=3600, public',
        '.xml': 'max-age=3600, public',
        
        // Default for other files - medium cache (1 day)
        'default': 'max-age=86400, public'
    };
    
    return cacheRules[ext] || cacheRules['default'];
};

const getContentTypeForFile = (filePath) => {
    const mimeType = mime.lookup(filePath);
    
    // Special handling for specific files
    if (path.basename(filePath) === 'manifest.json') {
        return 'application/manifest+json';
    }
    
    return mimeType || 'application/octet-stream';
};

const uploadFile = async (bucketName, localFilePath, s3Key) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const contentType = getContentTypeForFile(localFilePath);
        const cacheControl = getCacheControlForFile(localFilePath);
        
        const uploadParams = {
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType,
            CacheControl: cacheControl,
            Metadata: {
                'upload-time': new Date().toISOString(),
                'original-path': localFilePath,
                'cloudfront-demo': 'true'
            }
        };

        const result = await s3.upload(uploadParams).promise();
        
        return {
            key: s3Key,
            size: fileContent.length,
            contentType: contentType,
            cacheControl: cacheControl,
            etag: result.ETag,
            location: result.Location
        };

    } catch (error) {
        console.error(` Error uploading ${s3Key}:`, error.message);
        throw error;
    }
};

const uploadDirectory = async (bucketName, localDirPath, s3Prefix = '') => {
    const uploadResults = [];
    
    const uploadDirRecursive = async (currentPath, currentPrefix) => {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                // Recursively upload subdirectory
                const newPrefix = currentPrefix ? `${currentPrefix}/${item}` : item;
                await uploadDirRecursive(itemPath, newPrefix);
            } else if (stat.isFile()) {
                // Upload file
                const s3Key = currentPrefix ? `${currentPrefix}/${item}` : item;
                
                console.log(`⬆️  Uploading: ${s3Key}`);
                const result = await uploadFile(bucketName, itemPath, s3Key);
                
                console.log(`    Size: ${(result.size / 1024).toFixed(2)} KB`);
                console.log(`    Content-Type: ${result.contentType}`);
                console.log(`    Cache-Control: ${result.cacheControl}`);
                console.log(`    ETag: ${result.etag}`);
                console.log('');
                
                uploadResults.push(result);
            }
        }
    };
    
    await uploadDirRecursive(localDirPath, s3Prefix);
    return uploadResults;
};

const uploadReactApp = async () => {
    try {
        const accountId = await getAccountId();
        const bucketName = `s3-demo-static-website-${accountId}`;
        
        // Path to the React app build directory
        const buildPath = path.join(__dirname, '../../buna-beans-static/build');
        
        // Check if build directory exists
        if (!fs.existsSync(buildPath)) {
            console.log(' Build directory not found at:', buildPath);
            console.log(' Please run the React build first:');
            console.log('   cd buna-beans-static && npm run build');
            return;
        }
        
        console.log(' Uploading Buna Beans React App to S3...\n');
        console.log(` Source: ${buildPath}`);
        console.log(` Bucket: ${bucketName}`);
        console.log(` CloudFront will serve from this bucket\n`);
        
        // Upload the entire build directory
        const uploadResults = await uploadDirectory(bucketName, buildPath);
        
        // Summary
        console.log(' React App Upload Complete!\n');
        console.log(' Upload Summary:');
        console.log(`    Total files: ${uploadResults.length}`);
        
        // Group by file type for summary
        const fileTypeStats = {};
        let totalSize = 0;
        
        uploadResults.forEach(result => {
            const ext = path.extname(result.key).toLowerCase() || 'no-extension';
            if (!fileTypeStats[ext]) {
                fileTypeStats[ext] = { count: 0, size: 0 };
            }
            fileTypeStats[ext].count++;
            fileTypeStats[ext].size += result.size;
            totalSize += result.size;
        });
        
        console.log(`    Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
        
        console.log(' Files by type:');
        Object.entries(fileTypeStats)
            .sort(([,a], [,b]) => b.size - a.size)
            .forEach(([ext, stats]) => {
                console.log(`   ${ext || 'no-ext'}: ${stats.count} files, ${(stats.size / 1024).toFixed(2)} KB`);
            });
        
        console.log('\n Access URLs:');
        console.log(`    S3 Website: http://${bucketName}.s3-website-us-east-1.amazonaws.com`);
        console.log(`    CloudFront: https://[your-distribution-domain].cloudfront.net`);
        
        console.log('\n  Important Notes:');
        console.log('    S3 bucket is private - only accessible via CloudFront');
        console.log('    Cache TTL: HTML=1hr, CSS/JS=1day, Images=1week');
        console.log('    CloudFront deployment takes 15-20 minutes');
        
        // Find and highlight key files
        const keyFiles = uploadResults.filter(result => 
            result.key === 'index.html' || 
            result.key.includes('main.') ||
            result.key === 'manifest.json'
        );
        
        if (keyFiles.length > 0) {
            console.log('\n Key files uploaded:');
            keyFiles.forEach(file => {
                console.log(`   📄 ${file.key} (${file.contentType})`);
            });
        }
        
        return {
            bucketName,
            uploadResults,
            totalFiles: uploadResults.length,
            totalSize,
            fileTypeStats
        };

    } catch (error) {
        console.error(' Error uploading React app:', error.message);
        throw error;
    }
};

const createTestFiles = () => {
    // Keep the original test files function for basic testing
    const testDir = path.join(__dirname, '../../public/test-assets');
    
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
        fs.mkdirSync(path.join(testDir, 'styles'), { recursive: true });
        fs.mkdirSync(path.join(testDir, 'scripts'), { recursive: true });
        fs.mkdirSync(path.join(testDir, 'images'), { recursive: true });
    }

    // Create simple test HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudFront Cache Test</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <h1>CloudFront Cache Test Page</h1>
    <p>Generated at: ${new Date().toISOString()}</p>
    <p>Cache ID: ${Math.random().toString(36).substring(7)}</p>
    <img src="images/test-image.svg" alt="Test Image">
    <script src="scripts/main.js"></script>
    <a href="/">Go to Buna Beans App</a>
</body>
</html>`;

    // Write basic test files
    fs.writeFileSync(path.join(testDir, 'cache-test.html'), htmlContent);
    
    console.log(' Basic test files created in:', testDir);
    return testDir;
};

const uploadTestFiles = async () => {
    try {
        console.log(' Choose upload option:');
        console.log('1. Upload React App (Buna Beans)');
        console.log('2. Upload basic test files only\n');
        
        // For now, let's upload the React app by default
        // You can modify this to add CLI arguments if needed
        const uploadReactApp_result = await uploadReactApp();
        
        // Also create and upload basic test files for cache testing
        console.log('\n Creating additional test files...');
        createTestFiles();
        
        const accountId = await getAccountId();
        const bucketName = `s3-demo-static-website-${accountId}`;
        const testDir = path.join(__dirname, '../../public/test-assets');
        
        console.log('⬆  Uploading basic test files...');
        const testResults = await uploadDirectory(bucketName, testDir, 'test');
        
        console.log('\n All uploads complete!');
        console.log(` React app files: ${uploadReactApp_result.totalFiles}`);
        console.log(` Test files: ${testResults.length}`);
        
        return {
            reactApp: uploadReactApp_result,
            testFiles: testResults
        };

    } catch (error) {
        console.error(' Error in upload process:', error.message);
        throw error;
    }
};

// Export functions
module.exports = {
    uploadReactApp,
    uploadTestFiles,
    createTestFiles,
    getCacheControlForFile,
    getContentTypeForFile
};

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'react') {
        uploadReactApp();
    } else if (args[0] === 'test') {
        createTestFiles();
        uploadTestFiles();
    } else {
        // Default: upload both
        uploadTestFiles();
    }
}