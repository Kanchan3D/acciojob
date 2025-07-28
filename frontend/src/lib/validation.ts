/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string, options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}): ValidationResult => {
  const {
    minLength = 6,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options || {};

  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  if (password.length > 100) {
    return { isValid: false, error: 'Password must be less than 100 characters' };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (requireNumbers && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string, options?: {
  minLength?: number;
  maxLength?: number;
}): ValidationResult => {
  const { minLength = 2, maxLength = 50 } = options || {};

  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < minLength) {
    return { isValid: false, error: `Name must be at least ${minLength} characters` };
  }

  if (name.trim().length > maxLength) {
    return { isValid: false, error: `Name must be less than ${maxLength} characters` };
  }

  return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (confirmPassword: string, originalPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (confirmPassword !== originalPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

// Generic required field validation
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
};

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  formData: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<keyof T, string> } => {
  const errors: Record<keyof T, string> = {} as Record<keyof T, string>;
  let isValid = true;

  Object.keys(validators).forEach((key) => {
    const field = key as keyof T;
    const validator = validators[field];
    const result = validator(formData[field]);

    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Password strength indicator
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
} => {
  if (!password) {
    return { score: 0, label: 'No password', color: 'gray', suggestions: ['Enter a password'] };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  // Uppercase check
  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters');

  // Lowercase check
  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add lowercase letters');

  // Numbers check
  if (/\d/.test(password)) score++;
  else suggestions.push('Add numbers');

  // Special characters check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else suggestions.push('Add special characters');

  // Length bonus
  if (password.length >= 12) score++;

  let label: string;
  let color: string;

  if (score <= 2) {
    label = 'Weak';
    color = 'red';
  } else if (score <= 4) {
    label = 'Fair';
    color = 'yellow';
  } else if (score <= 5) {
    label = 'Good';
    color = 'blue';
  } else {
    label = 'Strong';
    color = 'green';
  }

  return { score, label, color, suggestions };
};
