# S3 Demo Project README

# S3 Demo Project

This project demonstrates how to interact with Amazon S3 using the AWS SDK for JavaScript. It includes command-line interface (CLI) commands and SDK operations for managing S3 buckets and objects.

## Table of Contents

- [Prerequisites](#prerequisites)
- [CORS](#cors)

## Prerequisites

- Node.js (version 14.x or later)
- AWS Account
- AWS CLI configured with appropriate permissions

## CORS Implementation with S3 - Complete Guide

This document outlines the complete process we followed to implement and test Cross-Origin Resource Sharing (CORS) with Amazon S3.

---

### Overview

**CORS (Cross-Origin Resource Sharing)** is a security feature implemented by web browsers that restricts web pages from making requests to a different domain than the one serving the web page. This is known as the "same-origin policy."

In our case, we needed to:
- Configure S3 bucket to allow cross-origin requests
- Create a web application hosted on a different origin
- Test CORS functionality by making requests from the web app to S3

### CORS Configuration Explained:**
* AllowedOrigins: Specifies which domains can make requests (http://localhost:3000)
* AllowedMethods: HTTP methods allowed (GET for fetching objects)
* AllowedHeaders: Headers that can be sent in requests (* allows all)
* ExposeHeaders: Headers exposed to the client (ETag for object metadata)
* MaxAgeSeconds: How long browsers cache the CORS preflight response

### Express Server Features:
* Static File Serving: Serves HTML/CSS/JS from public/ directory
* API Endpoints: Provides dynamic S3 configuration data
* CORS Testing: Hosts the client on http://localhost:3000

### Client Features:
Dynamic Configuration: Fetches S3 details from server API
Object Listing: Shows available objects in the bucket
CORS Testing: Makes direct fetch request to S3 bucket

### CORS Flow Explained
1. Browser loads page from http://localhost:3000
2. JavaScript tries to fetch from https://bucket.s3.amazonaws.com
3. Browser sends preflight request (OPTIONS) to S3
4. S3 responds with CORS headers based on bucket policy
5. Browser allows/blocks the actual request based on CORS response
6. If allowed, actual GET request is sent and response received