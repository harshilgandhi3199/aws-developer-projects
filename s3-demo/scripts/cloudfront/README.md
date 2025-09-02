# CloudFront CDN Implementation with S3 Origin

This directory contains a complete implementation of AWS CloudFront Content Delivery Network (CDN) with S3 as the origin, designed to serve a React application with optimized caching strategies.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Usage](#detailed-usage)
- [Cache Strategy](#cache-strategy)
- [Scripts Overview](#scripts-overview)
- [Testing Results](#testing-results)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)

## Overview

**CloudFront** is AWS's Content Delivery Network (CDN) that delivers content to users with low latency by caching content at edge locations worldwide. This implementation demonstrates:

- S3 as Origin: Using S3 bucket as the content origin
- Origin Access Control (OAC): Secure access from CloudFront to S3
- Custom Cache Policies: Optimized TTL settings for different file types
- React App Deployment: Full React application serving via CDN
- Cache Performance Testing: Measuring cache hit/miss ratios
- Cache Invalidation: Scripts for clearing cached content

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │────│  CloudFront CDN  │────│   S3 Bucket     │
│                 │    │  (Edge Locations)│    │  (Private)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                │ Origin Access Control (OAC)
                                │
                       ┌──────────────────┐
                       │  Cache Policies  │
                       │  • HTML: 1 hour  │
                       │  • CSS/JS: 1 day │
                       │  • Images: 1 week│
                       └──────────────────┘
```

### Security Model:
- **S3 Bucket**: Private (no public access)
- **Origin Access Control**: Only CloudFront can access S3
- **HTTPS Only**: All traffic redirected to HTTPS

## Prerequisites

- **Node.js** (version 14.x or later)
- **AWS Account** with appropriate permissions
- **AWS CLI** configured with access keys
- **React App** built and ready for deployment (`buna-beans-static/build/`)

### Required AWS Permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:*",
                "s3:*",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

## Quick Start

### Option 1: Complete Automated Setup
```bash
# Run the complete setup (recommended)
node scripts/cloudfront/setupCloudFrontDemo.js
```

### Option 2: Step-by-Step Setup
```bash
# 1. Upload React app to S3
node scripts/cloudfront/uploadTestFiles.js react

# 2. Create CloudFront distribution
node scripts/cloudfront/createDistribution.js

# 3. Wait 15-20 minutes for deployment, then test
node scripts/cloudfront/testReactAppCache.js

# 4. (Optional) Test with your specific domain
node scripts/cloudfront/testReactAppCache.js d123456789.cloudfront.net
```

## Detailed Usage

### Step 1: Prepare React Application
```bash
# Ensure your React app is built
cd buna-beans-static
npm run build
cd ..
```

### Step 2: Upload to S3 with Cache Headers
```bash
# Upload React build files with optimized cache headers
node scripts/cloudfront/uploadTestFiles.js react
```

**What this does:**
- Uploads all files from `buna-beans-static/build/` to S3
- Applies appropriate `Cache-Control` headers based on file type
- Sets correct `Content-Type` for each file
- Creates metadata for tracking

### Step 3: Create CloudFront Distribution
```bash
# Create distribution with S3 origin and custom cache policy
node scripts/cloudfront/createDistribution.js
```

**What this creates:**
- CloudFront distribution with S3 as origin
- Origin Access Control (OAC) for secure S3 access
- Custom cache policy with 1-hour default TTL
- HTTPS-only viewer protocol policy
- PriceClass_100 (North America + Europe for cost optimization)

### Step 4: Test Cache Performance
```bash
# Test caching behavior (wait 15-20 minutes after distribution creation)
node scripts/cloudfront/testReactAppCache.js
```

**Expected Results:**
```
Testing React App Cache Performance via CloudFront...

Testing: Main page (index.html)
   URL: https://d123456789.cloudfront.net/
   Expected Cache: 1 hour
   First request (likely cache miss):
      Status: 200
      Response Time: 245ms
      Cache Status: Miss from cloudfront
      Age: 0s
   Second request (should be cache hit):
      Status: 200
      Response Time: 89ms
      Cache Status: Hit from cloudfront
      Age: 2s
   Performance Improvement: 156ms (63.7%)
   Cache Effectiveness: Working properly
```

## Cache Strategy

Our implementation uses a **tiered caching strategy** optimized for React applications:

### Cache TTL (Time To Live) Settings:

| File Type | TTL | Cache-Control Header | Reasoning |
|-----------|-----|---------------------|-----------|
| **HTML** (`.html`) | 1 hour | `max-age=3600, public` | App shell, may need frequent updates |
| **CSS** (`.css`) | 1 day | `max-age=86400, public` | Stylesheets change less frequently |
| **JavaScript** (`.js`) | 1 day | `max-age=86400, public` | App logic, versioned filenames |
| **Images** (`.png`, `.jpg`, `.svg`) | 1 week | `max-age=604800, public` | Static assets, rarely change |
| **Fonts** (`.woff`, `.woff2`) | 1 week | `max-age=604800, public` | Font files are static |
| **JSON** (`.json`) | 1 day | `max-age=86400, public` | Manifests and configs |

### Cache Key Configuration:
```javascript
// Simple cache key - ignores query strings, headers, cookies
CacheKey = URL_PATH_ONLY

// Examples:
// /static/css/main.abc123.css?v=1.0 → Cache Key: /static/css/main.abc123.css
// /index.html?timestamp=123456 → Cache Key: /index.html
```

## Scripts Overview

### Core Scripts:

#### `createDistribution.js`
- Creates CloudFront distribution with S3 origin
- Sets up Origin Access Control (OAC)
- Creates custom cache policy
- Updates S3 bucket policy for CloudFront access

#### `uploadTestFiles.js`
- Uploads React app build directory to S3
- Applies file-type-specific cache headers
- Sets correct MIME types
- Creates organized directory structure

#### `testReactAppCache.js`
- Tests cache performance (hit vs miss)
- Measures response times
- Validates cache headers
- Auto-detects distribution or accepts manual domain

### Utility Scripts:

#### `invalidateCache.js`
```bash
# Invalidate all cached content
node scripts/cloudfront/invalidateCache.js create E123456789 "/*"

# Invalidate specific files
node scripts/cloudfront/invalidateCache.js create E123456789 "/index.html" "/static/css/*"

# Check invalidation status
node scripts/cloudfront/invalidateCache.js list E123456789
```

#### `diagnoseAndFix.js`
```bash
# Troubleshoot and fix common CloudFront issues
node scripts/cloudfront/diagnoseAndFix.js
```

#### `setupCloudFrontDemo.js`
```bash
# Complete automated setup
node scripts/cloudfront/setupCloudFrontDemo.js
```

## Testing Results

### Performance Metrics (Typical Results):

```bash
Cache Performance Analysis:

┌─────────────────┬──────────────┬──────────────┬─────────────────┐
│ File Type       │ First Request│ Second Request│ Improvement     │
├─────────────────┼──────────────┼──────────────┼─────────────────┤
│ HTML (index)    │ 245ms        │ 89ms         │ 156ms (63.7%)   │
│ CSS (main)      │ 198ms        │ 45ms         │ 153ms (77.3%)   │
│ JS (bundle)     │ 312ms        │ 52ms         │ 260ms (83.3%)   │
│ Images (PNG)    │ 156ms        │ 38ms         │ 118ms (75.6%)   │
└─────────────────┴──────────────┴──────────────┴─────────────────┘

Cache Hit Rate: ~80-95% after initial loading
Average Speed Improvement: 70-85%
Global Edge Locations: 400+ worldwide
```

### Cache Headers Analysis:
```bash
Response Headers:
   Cache-Control: max-age=3600, public
   X-Cache: Hit from cloudfront
   X-Amz-Cf-Pop: DFW50-C1
   Age: 1847
   CloudFront-Viewer-Country: US
```

## Troubleshooting

### Common Issues and Solutions:

#### 403 Forbidden Errors
```bash
# Diagnosis: Check S3 bucket policy and OAC configuration
node scripts/cloudfront/diagnoseAndFix.js

# Manual fix: Update bucket policy with correct distribution ARN
# Check AWS console for distribution ID and update policy
```

#### Cache Not Working (Always Miss)
```bash
# Check cache policy configuration
node scripts/cloudfront/testCache.js metrics E123456789

# Verify cache headers in S3 objects
aws s3api head-object --bucket your-bucket --key index.html
```

#### Distribution Not Deploying
```bash
# Check distribution status
node scripts/cloudfront/testCache.js list

# Wait for "Deployed" status (15-20 minutes)
```

#### Files Not Found
```bash
# Verify S3 bucket contents
node scripts/cloudfront/checkS3Contents.js

# Re-upload if necessary
node scripts/cloudfront/uploadTestFiles.js react
```

### Debug Commands:
```bash
# Check CloudFront distribution status
aws cloudfront list-distributions --query 'DistributionList.Items[].{Id:Id,Domain:DomainName,Status:Status}'

# Test specific URL with curl
curl -I https://d123456789.cloudfront.net/

# Check S3 bucket policy
aws s3api get-bucket-policy --bucket s3-demo-static-website-ACCOUNT-ID
```

## Cost Optimization

### Implemented Cost-Saving Features:

#### 1. Price Class Optimization
```javascript
PriceClass: 'PriceClass_100'  // North America + Europe only
// Saves ~40% compared to global edge locations
```

#### 2. Efficient Cache Strategy
- **Long TTL for static assets** → Reduces origin requests
- **Smart cache keys** → Maximizes cache hit ratio
- **Compression enabled** → Reduces bandwidth costs

#### 3. Origin Access Control
- **Private S3 bucket** → No data transfer charges for direct S3 access
- **CloudFront-only access** → Prevents bypass and unexpected costs

### Expected Monthly Costs (Low Traffic):
```
AWS Free Tier Eligible:
   • CloudFront: First 1TB data transfer free
   • S3: 5GB storage, 20,000 GET requests free
   • Total: ~$0-5/month for small applications

Post Free Tier (Estimated):
   • CloudFront: $0.085/GB data transfer
   • S3: $0.023/GB storage
   • Requests: $0.0004 per 10,000 requests
```

## Next Steps

### Production Enhancements:
1. **Custom Domain**: Add Route 53 DNS and SSL certificate
2. **Monitoring**: Set up CloudWatch alarms for cache hit ratio
3. **Security**: Add WAF (Web Application Firewall)
4. **Performance**: Implement Lambda@Edge for dynamic content
5. **CI/CD**: Automate deployment and cache invalidation

### Advanced Features to Explore:
- Real-time logs and analytics
- Geographic content restriction
- HTTP/2 and HTTP/3 support
- Origin failover configuration
- Multiple cache behaviors for API endpoints

## Additional Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFront Cache Behaviors](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesCacheBehavior)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Your React app is now served globally with optimized caching via AWS CloudFront!**

Access your application at: `https://your-distribution-domain.cloudfront.net`