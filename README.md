# Aerotage Time Reporting API

AWS Serverless backend API for the Aerotage Time Reporting Application.

## Architecture

- **Authentication**: AWS Cognito User Pools
- **API**: AWS API Gateway + Lambda Functions
- **Database**: Amazon DynamoDB
- **File Storage**: Amazon S3
- **Email**: Amazon SES
- **Infrastructure**: AWS CDK (TypeScript)

## Getting Started

### Prerequisites

1. AWS CLI installed and configured
2. Node.js 18+ and npm
3. AWS CDK CLI installed globally

### Installation

```bash
# Install dependencies
npm install

# Install CDK globally (if not already installed)
npm install -g aws-cdk

# Bootstrap CDK (one-time per AWS account/region)
cdk bootstrap --profile aerotage-dev
```

### Development

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run watch

# Run tests
npm test

# Deploy to development
npm run deploy:dev

# View CloudFormation changes
npm run diff
```

### Environment Setup

Create environment-specific configuration:

```bash
# Development
export AWS_PROFILE=aerotage-dev
export STAGE=dev

# Deploy
npm run deploy:dev
```

## API Endpoints

- **Authentication**: `/auth/*`
- **Users**: `/users/*`
- **Teams**: `/teams/*`
- **Projects**: `/projects/*`
- **Time Entries**: `/time-entries/*`
- **Reports**: `/reports/*`
- **Invoices**: `/invoices/*`

## Deployment

- **Development**: `npm run deploy:dev`
- **Staging**: `npm run deploy:staging`
- **Production**: `npm run deploy:prod`

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Infrastructure

The infrastructure is defined using AWS CDK and includes:

- **Cognito User Pool**: Authentication and user management
- **DynamoDB Tables**: Data storage with GSI for efficient queries
- **API Gateway**: RESTful API with Cognito authorization
- **Lambda Functions**: Business logic for all endpoints
- **S3 Buckets**: File storage for invoices and reports
- **CloudWatch**: Monitoring, logging, and alerting

## Environment Variables

Copy `.env.example` to `.env.development`, `.env.staging`, and `.env.production` and configure:

- `AWS_PROFILE`: AWS CLI profile to use
- `AWS_REGION`: AWS region for deployment
- `STAGE`: Environment stage (dev, staging, prod)

## License

Copyright (c) 2025 Aerotage Design Group, Inc 