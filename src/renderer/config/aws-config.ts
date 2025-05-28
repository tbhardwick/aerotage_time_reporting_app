export const awsConfig = {
  // API Gateway - Updated with custom domain
  apiGatewayUrl: 'https://time-api-dev.aerotage.com',
  
  // Backup API URL (fallback)
  backupApiUrl: 'https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev',
  
  // Cognito Authentication - Updated with provided configuration
  region: 'us-east-1',
  userPoolId: 'us-east-1_EsdlgX9Qg',
  userPoolClientId: '148r35u6uultp1rmfdu22i8amb',
  identityPoolId: 'us-east-1:d79776bb-4b8e-4654-a10a-a45b1adaa787',
  
  // Health check endpoint
  healthCheckEndpoint: '/health',
  
  // Password reset configuration
  passwordResetConfig: {
    enabled: true,
    codeDeliveryMethod: 'EMAIL',
    codeExpirationMinutes: 15,
  },
  
  // Password policy for frontend validation
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: false, // Optional per backend configuration
  },
  
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
    },
  },
  API: {
    REST: {
      AerotageAPI: {
        endpoint: awsConfig.apiGatewayUrl,
        region: awsConfig.region,
      },
    },
  },
  Storage: {
    S3: {
      bucket: awsConfig.storageBucket,
      region: awsConfig.region,
    },
  },
}; 