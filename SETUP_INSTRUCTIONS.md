# AWS Backend Setup Instructions

## 🚀 Quick Start Guide

Your AWS backend repository is ready! Follow these steps to deploy your serverless infrastructure.

## Prerequisites ✅ COMPLETED & UPDATED
- [x] AWS CLI installed and updated (v2.27.22) ⬆️ **LATEST**
- [x] AWS CDK installed and updated (v2.1016.1) ✅ **LATEST**
- [x] Backend repository structure created
- [x] Dependencies updated to latest versions
- [x] CDK Library updated to v2.198.0 ⬆️ **LATEST**

## AWS Tools Status ✅ UPDATED
Your AWS command line tools have been successfully updated to the latest versions:

- **AWS CLI**: `2.27.22` (latest stable)
- **CDK CLI**: `2.1016.1` (latest stable)  
- **CDK Library**: `2.198.0` (latest stable)
- **Constructs**: `10.4.2` (latest stable)

## Step 1: AWS Account Setup

### 1.1 Get AWS Credentials
1. Log into your AWS Console
2. Go to **IAM** → **Users** → **Create user**
3. Create a user named `aerotage-dev-user`
4. Attach policy: `AdministratorAccess` (for initial setup)
5. Create **Access Keys** and save them securely

### 1.2 Configure AWS Profile
```bash
aws configure --profile aerotage-dev
```
Enter your credentials when prompted:
- **AWS Access Key ID**: `your-access-key`
- **AWS Secret Access Key**: `your-secret-key`
- **Default region**: `us-east-1`
- **Default output format**: `json`

### 1.3 Test AWS Connection
```bash
aws sts get-caller-identity --profile aerotage-dev
```

## Step 2: CDK Bootstrap

### 2.1 Bootstrap CDK (One-time setup)
```bash
export AWS_PROFILE=aerotage-dev
export STAGE=dev
cdk bootstrap
```

### 2.2 Verify Bootstrap
```bash
aws cloudformation list-stacks --profile aerotage-dev
```

## Step 3: Create Infrastructure Files

Currently, your infrastructure files are placeholders. Create these files:

### 3.1 Main CDK App (`infrastructure/bin/aerotage-time-api.ts`)
Create the main CDK entry point that orchestrates all stacks.

### 3.2 Cognito Stack (`infrastructure/lib/cognito-stack.ts`)
Authentication and user management infrastructure.

### 3.3 Database Stack (`infrastructure/lib/database-stack.ts`)
DynamoDB tables for data storage.

### 3.4 API Stack (`infrastructure/lib/api-stack.ts`)
API Gateway and Lambda functions.

### 3.5 Storage Stack (`infrastructure/lib/storage-stack.ts`)
S3 buckets for file storage.

### 3.6 Monitoring Stack (`infrastructure/lib/monitoring-stack.ts`)
CloudWatch monitoring and alerting.

## Step 4: Development Workflow

### 4.1 Build and Deploy
```bash
# Build TypeScript
npm run build

# Preview changes
npm run diff

# Deploy to development
npm run deploy:dev
```

### 4.2 Environment Variables
Create `.env.development`:
```bash
AWS_PROFILE=aerotage-dev
AWS_REGION=us-east-1
STAGE=dev
```

## Step 5: Frontend Integration

After successful backend deployment, you'll get outputs like:
- **User Pool ID**: For Cognito authentication
- **API Gateway URL**: For API calls
- **S3 Bucket**: For file uploads

Update your frontend's AWS configuration with these values.

## Deployment Commands

```bash
# Development
npm run deploy:dev

# Check deployment status
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --profile aerotage-dev

# View API Gateway endpoint
aws apigateway get-rest-apis --profile aerotage-dev
```

## Troubleshooting

### Common Issues:

1. **Permission Denied**: Ensure IAM user has sufficient permissions
2. **Region Mismatch**: Use consistent region (us-east-1) everywhere
3. **CDK Version**: CDK CLI and library are now on latest versions ✅

### Useful Commands:

```bash
# Check CDK version
cdk --version

# List CDK stacks
cdk list

# Show stack differences
cdk diff AerotageAuth-dev

# Destroy stack (careful!)
cdk destroy AerotageAuth-dev
```

### Version Compatibility ✅ VERIFIED
All AWS tools are now on latest stable versions:
- CDK CLI `2.1016.1` + CDK Library `2.198.0` = ✅ Compatible
- AWS CLI `2.27.22` = ✅ Latest features and security updates

## Next Steps After Deployment

1. **Test Authentication**: Create test users in Cognito
2. **API Testing**: Test endpoints with Postman/curl
3. **Frontend Integration**: Update Amplify configuration
4. **Data Migration**: Import initial data if needed

## Support

If you encounter issues:
1. Check CloudFormation console for detailed error messages
2. Review CDK documentation: https://docs.aws.amazon.com/cdk/
3. Check AWS service limits and quotas

---

**✅ Tools Updated & Ready!** Your AWS CLI and CDK are now on the latest versions. Ready to deploy? Run `npm run deploy:dev` when AWS credentials are configured! 