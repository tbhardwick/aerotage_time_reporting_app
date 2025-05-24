/**
 * Password Reset Testing Utility
 * Based on backend team's testing recommendations
 */

import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { handlePasswordResetErrors, validatePasswordPolicy } from './passwordResetErrors';

/**
 * Test password reset request flow
 */
export const testPasswordResetRequest = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔄 Testing password reset request for:', email);
    
    const result = await resetPassword({ username: email });
    
    console.log('✅ Password reset request successful:', result);
    return {
      success: true,
      message: 'Password reset request sent successfully. Check email for code.',
    };
    
  } catch (error: any) {
    console.error('❌ Password reset request failed:', error);
    const errorMessage = handlePasswordResetErrors(error);
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Test password reset confirmation flow
 */
export const testPasswordResetConfirmation = async (
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔄 Testing password reset confirmation...');
    
    // Validate password policy first
    const passwordValidation = validatePasswordPolicy(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
      };
    }
    
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword: newPassword,
    });
    
    console.log('✅ Password reset confirmation successful');
    return {
      success: true,
      message: 'Password reset completed successfully!',
    };
    
  } catch (error: any) {
    console.error('❌ Password reset confirmation failed:', error);
    const errorMessage = handlePasswordResetErrors(error);
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Test password policy validation
 */
export const testPasswordPolicyValidation = () => {
  const testPasswords = [
    { password: 'weak', expected: false, description: 'Too short' },
    { password: 'nodigits', expected: false, description: 'No digits' },
    { password: 'NOCAPS', expected: false, description: 'No lowercase' },
    { password: 'nocaps123', expected: false, description: 'No uppercase' },
    { password: 'ValidPass123', expected: true, description: 'Valid password' },
    { password: 'AnotherValid1', expected: true, description: 'Another valid password' },
  ];
  
  console.log('🧪 Testing password policy validation...');
  
  testPasswords.forEach(({ password, expected, description }) => {
    const result = validatePasswordPolicy(password);
    const passed = result.isValid === expected;
    
    console.log(
      passed ? '✅' : '❌',
      `${description}: "${password}" - Expected: ${expected}, Got: ${result.isValid}`
    );
    
    if (!result.isValid) {
      console.log('   Errors:', result.errors);
    }
  });
};

/**
 * Test invalid email scenarios (security test)
 */
export const testInvalidEmailScenarios = async (): Promise<void> => {
  const invalidEmails = [
    'nonexistent@example.com',
    'invalid-email',
    'test@fake-domain.xyz',
  ];
  
  console.log('🔒 Testing invalid email scenarios (security)...');
  
  for (const email of invalidEmails) {
    const result = await testPasswordResetRequest(email);
    console.log(`Email: ${email} - Result: ${result.message}`);
    
    // All should return the same generic message for security
    if (result.message.includes('If this email is registered')) {
      console.log('✅ Security: No information leakage detected');
    } else {
      console.log('⚠️  Security: Potential information leakage');
    }
  }
};

/**
 * Complete end-to-end test flow
 */
export const runCompletePasswordResetTest = async (testEmail: string): Promise<void> => {
  console.log('🚀 Starting complete password reset test flow...');
  console.log('=' .repeat(50));
  
  // Step 1: Test password policy validation
  console.log('\n1. Testing password policy validation...');
  testPasswordPolicyValidation();
  
  // Step 2: Test invalid email scenarios
  console.log('\n2. Testing invalid email scenarios...');
  await testInvalidEmailScenarios();
  
  // Step 3: Test valid email request
  console.log('\n3. Testing password reset request...');
  const requestResult = await testPasswordResetRequest(testEmail);
  console.log('Request result:', requestResult.message);
  
  if (requestResult.success) {
    console.log('\n✅ Password reset request successful!');
    console.log('📧 Check email for reset code');
    console.log('📝 Use the code with testPasswordResetConfirmation() function');
    console.log('\nExample:');
    console.log(`testPasswordResetConfirmation('${testEmail}', 'CODE_FROM_EMAIL', 'NewPassword123')`);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test flow completed');
};

/**
 * Export test functions for console use
 */
export const passwordResetTests = {
  testRequest: testPasswordResetRequest,
  testConfirmation: testPasswordResetConfirmation,
  testPasswordPolicy: testPasswordPolicyValidation,
  testInvalidEmails: testInvalidEmailScenarios,
  runCompleteTest: runCompletePasswordResetTest,
};

// Make tests available in browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).passwordResetTests = passwordResetTests;
  console.log('🧪 Password reset tests available in console: passwordResetTests');
} 