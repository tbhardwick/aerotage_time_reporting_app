#!/bin/bash

echo "👤 Creating Admin User for Aerotage Time Reporting"
echo "================================================="

# Check if AWS CLI is configured with aerotage-dev profile
if ! aws sts get-caller-identity --profile aerotage-dev &> /dev/null; then
    echo "❌ AWS CLI not configured with aerotage-dev profile."
    echo "💡 Try running: aws configure --profile aerotage-dev"
    exit 1
fi

echo "✅ AWS CLI configured with aerotage-dev profile"

# Your existing User Pool ID from aws-config.ts
USER_POOL_ID="us-east-1_EsdlgX9Qg"

echo "🔧 Using existing User Pool: $USER_POOL_ID"

# Create initial admin user
echo "👤 Creating initial admin user..."

aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username admin@aerotage.com \
    --user-attributes Name=email,Value=admin@aerotage.com Name=given_name,Value=Admin Name=family_name,Value=User \
    --temporary-password TempPassword123! \
    --message-action SUPPRESS \
    --profile aerotage-dev

if [ $? -eq 0 ]; then
    echo "✅ Admin user created successfully!"
    
    # Add user to admin group
    echo "🔐 Adding user to admin group..."
    aws cognito-idp admin-add-user-to-group \
        --user-pool-id $USER_POOL_ID \
        --username admin@aerotage.com \
        --group-name admin \
        --profile aerotage-dev
    
    if [ $? -eq 0 ]; then
        echo "✅ User added to admin group!"
        echo ""
        echo "🎉 Setup Complete!"
        echo "=================="
        echo "📧 Email: admin@aerotage.com"
        echo "🔑 Temporary Password: TempPassword123!"
        echo "⚠️  You will be prompted to change the password on first login"
        echo ""
        echo "📱 Next Steps:"
        echo "1. Start the frontend application: npm run dev"
        echo "2. Open the app and login with admin@aerotage.com"
        echo "3. Set a new password when prompted"
        echo "4. Create additional users through the admin interface"
        echo ""
        echo "🔗 Useful URLs:"
        echo "Cognito Console: https://console.aws.amazon.com/cognito/users/?region=us-east-1#/pool/$USER_POOL_ID/users"
    else
        echo "❌ Failed to add user to admin group. User created but may not have admin permissions."
    fi
else
    echo "❌ Failed to create admin user. This might mean:"
    echo "   - User already exists"
    echo "   - Insufficient AWS permissions"
    echo "   - User Pool ID is incorrect"
    echo ""
    echo "🔍 Try checking existing users:"
    echo "aws cognito-idp list-users --user-pool-id $USER_POOL_ID --profile aerotage-dev"
fi 