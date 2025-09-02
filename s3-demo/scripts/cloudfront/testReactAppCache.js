const AWS = require('aws-sdk');
const https = require('https');

const testReactAppCaching = async (distributionDomain) => {
    console.log(' Testing React App Cache Performance via CloudFront...\n');

    const testUrls = [
        {
            url: `https://${distributionDomain}/`,
            description: 'Main page (index.html)',
            expectedCache: '1 hour'
        },
        {
            url: `https://${distributionDomain}/static/css`,
            description: 'CSS files',
            expectedCache: '1 day',
            isPattern: true
        },
        {
            url: `https://${distributionDomain}/static/js`,
            description: 'JavaScript files', 
            expectedCache: '1 day',
            isPattern: true
        },
        {
            url: `https://${distributionDomain}/manifest.json`,
            description: 'App manifest',
            expectedCache: '1 day'
        },
        {
            url: `https://${distributionDomain}/test/cache-test.html`,
            description: 'Test page',
            expectedCache: '1 hour'
        }
    ];

    for (const testCase of testUrls) {
        if (testCase.isPattern) {
            console.log(` Testing ${testCase.description} (${testCase.expectedCache}):`);
            console.log(`    Pattern: ${testCase.url}/*`);
            console.log(`    Expected Cache: ${testCase.expectedCache}`);
            console.log('   ' + '-'.repeat(60));
            continue;
        }

        console.log(` Testing: ${testCase.description}`);
        console.log(`    URL: ${testCase.url}`);
        console.log(`    Expected Cache: ${testCase.expectedCache}`);

        try {
            // Test cache performance for this URL
            await testSingleUrl(testCase.url);
        } catch (error) {
            console.log(`    Error: ${error.message}`);
        }
        
        console.log('   ' + '-'.repeat(60));
    }
};

const testSingleUrl = async (url) => {
    const makeRequest = (url) => {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const req = https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - start;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        responseTime: responseTime,
                        cacheStatus: res.headers['x-cache'] || 'Unknown',
                        ageHeader: res.headers['age'] || '0',
                        cacheControl: res.headers['cache-control'] || 'Not set',
                        contentLength: res.headers['content-length'] || '0'
                    });
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.abort();
                reject(new Error('Request timeout'));
            });
        });
    };

    try {
        // First request
        console.log('    First request (likely cache miss):');
        const firstResponse = await makeRequest(url);
        console.log(`      Status: ${firstResponse.statusCode}`);
        console.log(`      Response Time: ${firstResponse.responseTime}ms`);
        console.log(`      Cache Status: ${firstResponse.cacheStatus}`);
        console.log(`      Cache-Control: ${firstResponse.cacheControl}`);
        console.log(`      Age: ${firstResponse.ageHeader}s`);
        console.log(`      Size: ${(firstResponse.contentLength / 1024).toFixed(2)} KB`);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Second request
        console.log('    Second request (should be cache hit):');
        const secondResponse = await makeRequest(url);
        console.log(`      Status: ${secondResponse.statusCode}`);
        console.log(`      Response Time: ${secondResponse.responseTime}ms`);
        console.log(`      Cache Status: ${secondResponse.cacheStatus}`);
        console.log(`      Age: ${secondResponse.ageHeader}s`);

        // Performance analysis
        const speedImprovement = firstResponse.responseTime - secondResponse.responseTime;
        const improvementPercent = (speedImprovement / firstResponse.responseTime * 100).toFixed(1);
        
        if (speedImprovement > 0) {
            console.log(`    Performance Improvement: ${speedImprovement}ms (${improvementPercent}%)`);
        } else {
            console.log(`    Performance: Similar response times (both cached or origin)`);
        }

        // Cache effectiveness
        const isCacheHit = secondResponse.cacheStatus.includes('Hit');
        console.log(`    Cache Effectiveness: ${isCacheHit ? ' Working' : '  Needs investigation'}`);

    } catch (error) {
        console.log(`    Error testing ${url}: ${error.message}`);
    }
};

// Export
module.exports = {
    testReactAppCaching,
    testSingleUrl
};

// Run if called directly
if (require.main === module) {
    const domain = process.argv[2];
    if (domain) {
        testReactAppCaching(domain);
    } else {
        console.log('Usage: node testReactAppCache.js <cloudfront-domain>');
        console.log('Example: node testReactAppCache.js d123456789.cloudfront.net');
    }
}