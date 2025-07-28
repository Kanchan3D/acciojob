/**
 * Password Validation Test Cases
 * 
 * This file contains test cases to verify the password validation works correctly
 * and matches the backend requirements exactly.
 */

// Backend requirement: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
// Minimum 6 characters, at least one lowercase, one uppercase, and one number

export const passwordTestCases = [
  // Valid passwords (should pass)
  { password: 'Password1', expected: true, description: 'Basic valid password' },
  { password: 'MyPass123', expected: true, description: 'Valid with mixed case and numbers' },
  { password: 'Test123456', expected: true, description: 'Valid longer password' },
  { password: 'Aa1bbb', expected: true, description: 'Minimum valid password' },
  { password: 'StrongP@ss1', expected: true, description: 'Valid with special characters' },
  
  // Invalid passwords (should fail)
  { password: '', expected: false, description: 'Empty password' },
  { password: 'pass', expected: false, description: 'Too short' },
  { password: 'password', expected: false, description: 'No uppercase or numbers' },
  { password: 'PASSWORD', expected: false, description: 'No lowercase or numbers' },
  { password: '123456', expected: false, description: 'No letters' },
  { password: 'Password', expected: false, description: 'No numbers' },
  { password: 'password1', expected: false, description: 'No uppercase' },
  { password: 'PASSWORD1', expected: false, description: 'No lowercase' },
  { password: 'Pass1', expected: false, description: 'Too short (5 chars)' },
  
  // Edge cases
  { password: ' Password1', expected: false, description: 'Leading space' },
  { password: 'Password1 ', expected: false, description: 'Trailing space' },
  { password: 'aaaAAA111', expected: false, description: 'Repeated characters' },
  { password: 'Abc123', expected: false, description: 'Sequential pattern' },
  { password: 'Qwerty1', expected: false, description: 'Keyboard pattern' },
];

/**
 * Test function to validate password patterns
 */
export const testPasswordValidation = () => {
  const backendPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  
  passwordTestCases.forEach((testCase, index) => {
    const isValid = testCase.password.length >= 6 && backendPattern.test(testCase.password);
    const passed = isValid === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Password: "${testCase.password}"`);
    console.log(`  Expected: ${testCase.expected}, Got: ${isValid}`);
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  });
};

/**
 * Backend pattern verification
 */
export const verifyBackendPattern = (password: string) => {
  const checks = {
    length: password.length >= 6,
    hasLowercase: /(?=.*[a-z])/.test(password),
    hasUppercase: /(?=.*[A-Z])/.test(password),
    hasNumber: /(?=.*\d)/.test(password),
    backendPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
  };
  
  const isValid = Object.values(checks).every(Boolean);
  
  return {
    isValid,
    checks,
    summary: `Password "${password}" ${isValid ? 'PASSES' : 'FAILS'} backend validation`
  };
};

// Example usage:
// console.log(verifyBackendPattern('Password123')); // Should pass
// console.log(verifyBackendPattern('password123'));  // Should fail (no uppercase)
// testPasswordValidation(); // Run all test cases
