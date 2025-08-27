# Lambda API Demo

This project demonstrates how to create a simple API using AWS Lambda and API Gateway. The backend is built with Node.js and interacts with various AWS services.

## Project Structure

- `src/`: Contains the source code for the backend.
- `package.json`: Lists the dependencies and scripts for the backend.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/aws-developer-projects.git
   cd aws-developer-projects/lambda-api-demo/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure AWS credentials**:
   Ensure your AWS credentials are set up in `~/.aws/credentials` or use environment variables.

4. **Deploy the Lambda function**:
   Use the AWS CLI or SDK to deploy your Lambda function.

5. **Test the API**:
   After deployment, you can test the API using tools like Postman or curl.

## Usage Examples

- **Invoke the Lambda function**:
   You can invoke the Lambda function directly using the AWS CLI:
   ```bash
   aws lambda invoke --function-name your-function-name output.txt
   ```

## License

This project is licensed under the MIT License. See the LICENSE file for details.