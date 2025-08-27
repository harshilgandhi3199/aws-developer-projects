# Lambda API Demo

This project demonstrates how to create a serverless API using AWS Lambda and API Gateway, along with a React frontend. The backend is built using Node.js, and the frontend is a single-page application (SPA) developed with React.

## Project Structure

- **frontend/**: Contains the source code for the React frontend.
- **backend/**: Contains the source code for the Node.js backend.

## Prerequisites

- Node.js and npm installed on your machine.
- AWS account with permissions to create Lambda functions and API Gateway.

## Setup Instructions

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Deploy the Lambda function:
   - Use the AWS CLI or SDK to deploy your Lambda function.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the React application:
   ```bash
   npm start
   ```

## Usage

- Access the frontend application in your browser at `http://localhost:3000`.
- The frontend will interact with the backend API deployed on AWS.

## Additional Documentation

For more detailed information about the Lambda API demo, refer to the [lambda-api.md](../../docs/lambda-api.md) documentation.