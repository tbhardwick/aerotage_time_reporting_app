#!/bin/bash

echo "🚀 Setting up Aerotage Time Reporting Backend"
echo "============================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK not found. Installing..."
    npm install -g aws-cdk
fi

echo "✅ AWS CDK available"

# Navigate to infrastructure directory
cd infrastructure

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Bootstrapping CDK (if needed)..."
cdk bootstrap

echo "🚀 Deploying infrastructure to development environment..."
echo "This may take 10-15 minutes..."

# Deploy all stacks
npm run deploy:dev

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Infrastructure deployed successfully!"
    
    # Get the outputs from the deployed stacks
    echo "📋 Getting deployment outputs..."
    
    # Get User Pool ID
    USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name AerotageAuth-dev --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
    
    # Get User Pool Client ID
    USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name AerotageAuth-dev --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)
    
    # Get API Gateway URL
    API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name AerotageAPI-dev --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
    
    echo "🔧 Deployment Information:"
    echo "User Pool ID: $USER_POOL_ID"
    echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
    echo "API Gateway URL: $API_GATEWAY_URL"
    
    # Create initial admin user
    echo "👤 Creating initial admin user..."
    
    aws cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username admin@aerotage.com \
        --user-attributes Name=email,Value=admin@aerotage.com Name=given_name,Value=Admin Name=family_name,Value=User \
        --temporary-password TempPassword123! \
        --message-action SUPPRESS
    
    # Add user to admin group
    aws cognito-idp admin-add-user-to-group \
        --user-pool-id $USER_POOL_ID \
        --username admin@aerotage.com \
        --group-name admin
    
    echo "✅ Admin user created!"
    echo "📧 Email: admin@aerotage.com"
    echo "🔑 Temporary Password: TempPassword123!"
    echo "⚠️  You will be prompted to change the password on first login"
    
    # Update the frontend configuration
    echo "🔧 Updating frontend configuration..."
    
    cd ..
    
    # Update the aws-config.ts file with real values
    cat > src/renderer/config/aws-config.ts << EOF
export const awsConfig = {
  // API Gateway
  apiGatewayUrl: '$API_GATEWAY_URL',
  
  // Cognito Authentication
  region: 'us-east-1',
  userPoolId: '$USER_POOL_ID',
  userPoolClientId: '$USER_POOL_CLIENT_ID',
  identityPoolId: 'us-east-1:d79776bb-4b8e-4654-a10a-a45b1adaa787',
  
  // Optional: S3 Buckets (for file uploads)
  storageBucket: 'aerotage-time-storage-dev',
  invoicesBucket: 'aerotage-time-invoices-dev',
  exportsBucket: 'aerotage-time-exports-dev',
};

// Amplify v6 configuration
export const amplifyConfig = {
  Auth: {
    Cognito: {
      region: awsConfig.region,
      userPoolId: awsConfig.userPoolId,
      userPoolClientId: awsConfig.userPoolClientId,
      identityPoolId: awsConfig.identityPoolId,
    }
  },
  API: {
    REST: {
      AerotageAPI: {
        endpoint: awsConfig.apiGatewayUrl,
        region: awsConfig.region,
      }
    }
  },
  Storage: {
    S3: {
      bucket: awsConfig.storageBucket,
      region: awsConfig.region,
    }
  }
};
EOF
    
    echo "✅ Frontend configuration updated!"
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo "Your Aerotage Time Reporting backend is now ready!"
    echo ""
    echo "📱 Next Steps:"
    echo "1. Start the frontend application: npm run dev"
    echo "2. Open the app and login with admin@aerotage.com"
    echo "3. Set a new password when prompted"
    echo "4. Create additional users through the admin interface"
    echo ""
    echo "🔗 Useful URLs:"
    echo "API Gateway: $API_GATEWAY_URL"
    echo "CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AerotageTimeAPI-dev"
    echo "Cognito Console: https://console.aws.amazon.com/cognito/users/?region=us-east-1#/pool/$USER_POOL_ID/users"
    
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi 