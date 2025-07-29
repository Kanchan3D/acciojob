'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const { register } = useAuthStore();
  const router = useRouter();

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'No password', color: 'gray', requirements: [] };
    
    const requirements = [];
    let score = 0;
    
    // Check backend requirements
    if (password.length >= 6) {
      requirements.push({ met: true, text: 'At least 6 characters' });
      score++;
    } else {
      requirements.push({ met: false, text: 'At least 6 characters' });
    }
    
    if (/(?=.*[a-z])/.test(password)) {
      requirements.push({ met: true, text: 'One lowercase letter' });
      score++;
    } else {
      requirements.push({ met: false, text: 'One lowercase letter' });
    }
    
    if (/(?=.*[A-Z])/.test(password)) {
      requirements.push({ met: true, text: 'One uppercase letter' });
      score++;
    } else {
      requirements.push({ met: false, text: 'One uppercase letter' });
    }
    
    if (/(?=.*\d)/.test(password)) {
      requirements.push({ met: true, text: 'One number' });
      score++;
    } else {
      requirements.push({ met: false, text: 'One number' });
    }
    
    // Bonus points for additional security
    if (password.length >= 8) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;
    
    let label: string;
    let color: string;
    
    if (score <= 2) {
      label = 'Weak';
      color = 'red';
    } else if (score <= 3) {
      label = 'Fair';
      color = 'yellow';
    } else if (score <= 4) {
      label = 'Good';
      color = 'blue';
    } else {
      label = 'Strong';
      color = 'green';
    }
    
    return { score, label, color, requirements };
  };

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) return 'Name is required';
    
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return 'Name must be between 2 and 50 characters';
    if (trimmedName.length > 50) return 'Name must be between 2 and 50 characters';
    
    // Check for invalid characters (allow letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Check for HTML/script tags
    if (/<[^>]*>/g.test(trimmedName)) {
      return 'Name cannot contain HTML tags';
    }
    
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return 'Email is required';
    
    const trimmedEmail = email.trim();
    
    // Length check
    if (trimmedEmail.length > 254) return 'Email is too long';
    
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return 'Please enter a valid email';
    
    // More comprehensive email validation
    const emailParts = trimmedEmail.split('@');
    if (emailParts.length !== 2) return 'Invalid email format';
    
    const [localPart, domainPart] = emailParts;
    
    // Local part validation
    if (localPart.length === 0 || localPart.length > 64) {
      return 'Invalid email format';
    }
    
    // Domain part validation
    if (domainPart.length === 0 || domainPart.length > 253) {
      return 'Invalid email format';
    }
    
    // Check for consecutive dots
    if (trimmedEmail.includes('..')) {
      return 'Email cannot contain consecutive dots';
    }
    
    // Check for HTML/script tags
    if (/<[^>]*>/g.test(trimmedEmail)) {
      return 'Email cannot contain HTML tags';
    }
    
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    
    // Length validation (matches backend)
    if (password.length < 6) return 'Password must be at least 6 characters long';
    if (password.length > 128) return 'Password is too long (max 128 characters)';
    
    // Exact backend pattern match: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    
    // Additional security checks (beyond backend requirements)
    
    // Check for whitespace at start or end
    if (password !== password.trim()) {
      return 'Password cannot start or end with spaces';
    }
    
    // Check for common patterns that make passwords weak
    if (/(.)\1{2,}/.test(password)) {
      return 'Password cannot contain repeated characters (e.g., aaa, 111)';
    }
    
    // Check for sequential patterns
    if (/123|abc|qwe|789|456/i.test(password)) {
      return 'Password cannot contain sequential characters (123, abc, etc.)';
    }
    
    // Check for keyboard patterns
    if (/qwerty|asdf|zxcv|1234|abcd/i.test(password)) {
      return 'Password cannot contain keyboard patterns';
    }
    
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const validateTerms = (agreed: boolean) => {
    if (!agreed) return 'You must agree to the Terms and Conditions';
    return '';
  };

  // Comprehensive password validation for pre-submission check
  const validatePasswordForSubmission = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check all backend requirements exactly
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    // Exact backend regex pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
    const backendPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!backendPattern.test(password)) {
      // Break down which requirements are missing
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
    }
    
    // Additional security checks
    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)');
    }
    
    // Check for obvious security issues
    const commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123', 
      'admin', 'letmein', 'welcome', 'monkey', 'dragon'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Final pre-submission validation - comprehensive check before API call
  const performFinalValidation = () => {
    console.log('🔍 Performing final validation before sending to backend...');
    
    const validationResults = {
      name: { isValid: false, error: '' },
      email: { isValid: false, error: '' },
      password: { isValid: false, error: '' },
      confirmPassword: { isValid: false, error: '' },
      terms: { isValid: false, error: '' }
    };
    
    // Validate name
    const nameValidation = validateName(formData.name);
    validationResults.name = {
      isValid: !nameValidation,
      error: nameValidation
    };
    
    // Validate email
    const emailValidation = validateEmail(formData.email);
    validationResults.email = {
      isValid: !emailValidation,
      error: emailValidation
    };
    
    // Validate password with backend pattern
    const passwordValidation = validatePasswordForSubmission(formData.password);
    validationResults.password = {
      isValid: passwordValidation.isValid,
      error: passwordValidation.errors.join(', ')
    };
    
    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, formData.password);
    validationResults.confirmPassword = {
      isValid: !confirmPasswordValidation,
      error: confirmPasswordValidation
    };
    
    // Validate terms
    validationResults.terms = {
      isValid: agreeTerms,
      error: agreeTerms ? '' : 'You must agree to the Terms and Conditions'
    };
    
    // Log validation results
    console.log('🔍 Final validation results:', validationResults);
    
    // Check if all validations pass
    const allValid = Object.values(validationResults).every(result => result.isValid);
    
    if (!allValid) {
      const errors = Object.entries(validationResults)
        .filter(([_, result]) => !result.isValid)
        .map(([field, result]) => `${field}: ${result.error}`);
      
      console.error('❌ Final validation failed:', errors);
      return { isValid: false, errors };
    }
    
    console.log('✅ Final validation passed - safe to send to backend');
    return { isValid: true, errors: [] };
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate all form fields
    newErrors.name = validateName(formData.name);
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);
    newErrors.terms = validateTerms(agreeTerms);
    
    // Additional security checks
    if (formData.name.trim() && formData.name.trim() !== formData.name) {
      newErrors.name = 'Name cannot start or end with spaces';
    }
    
    if (formData.email.trim() && formData.email !== formData.email.toLowerCase()) {
      // Email will be converted to lowercase, but warn user about mixed case
      console.warn('Email will be converted to lowercase');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(formData.password.toLowerCase())) {
      newErrors.password = 'Please choose a more secure password';
    }
    
    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation for touched fields
    if (touched[name]) {
      const newErrors = { ...errors };
      
      switch (name) {
        case 'name':
          const nameError = validateName(value);
          if (nameError) newErrors.name = nameError;
          else delete newErrors.name;
          break;
        case 'email':
          const emailError = validateEmail(value);
          if (emailError) newErrors.email = emailError;
          else delete newErrors.email;
          break;
        case 'password':
          const passwordError = validatePassword(value);
          if (passwordError) newErrors.password = passwordError;
          else delete newErrors.password;
          
          // Also validate confirm password if it's been touched
          if (touched.confirmPassword) {
            const confirmError = validateConfirmPassword(formData.confirmPassword, value);
            if (confirmError) newErrors.confirmPassword = confirmError;
            else delete newErrors.confirmPassword;
          }
          break;
        case 'confirmPassword':
          const confirmError = validateConfirmPassword(value, formData.password);
          if (confirmError) newErrors.confirmPassword = confirmError;
          else delete newErrors.confirmPassword;
          break;
      }
      
      setErrors(newErrors);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });

    // Trigger validation for this field
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        const nameError = validateName(formData.name);
        if (nameError) newErrors.name = nameError;
        else delete newErrors.name;
        break;
      case 'email':
        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;
        else delete newErrors.email;
        break;
      case 'password':
        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;
        else delete newErrors.password;
        break;
      case 'confirmPassword':
        const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password);
        if (confirmError) newErrors.confirmPassword = confirmError;
        else delete newErrors.confirmPassword;
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting form submission...');
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });
    
    // Step 1: Initial form validation
    console.log('📝 Step 1: Running initial form validation...');
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    // Step 2: Final comprehensive validation before backend
    console.log('🔒 Step 2: Running final validation before backend...');
    const finalValidation = performFinalValidation();
    if (!finalValidation.isValid) {
      console.error('❌ Final validation failed:', finalValidation.errors);
      toast.error(`Validation failed: ${finalValidation.errors[0]}`);
      return;
    }
    
    // Step 3: Data preparation and sanitization
    console.log('🛠️ Step 3: Preparing and sanitizing data...');
    const trimmedName = formData.name.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();
    
    // Step 4: Backend pattern verification (triple check)
    console.log('🔍 Step 4: Triple-checking backend pattern compliance...');
    const backendPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    
    const passwordChecks = {
      hasMinLength: formData.password.length >= 6,
      hasLowercase: /(?=.*[a-z])/.test(formData.password),
      hasUppercase: /(?=.*[A-Z])/.test(formData.password),
      hasNumber: /(?=.*\d)/.test(formData.password),
      meetsBackendPattern: backendPasswordPattern.test(formData.password)
    };
    
    console.log('🔐 Password validation details:', {
      password: '***HIDDEN***',
      length: formData.password.length,
      checks: passwordChecks,
      backendRequirement: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
      allChecksPassed: Object.values(passwordChecks).every(Boolean)
    });
    
    if (!Object.values(passwordChecks).every(Boolean)) {
      console.error('❌ Password does not meet backend requirements');
      toast.error('Password does not meet security requirements');
      return;
    }
    
    // Step 5: Final data validation
    console.log('✅ Step 5: Final data type and format validation...');
    if (typeof trimmedName !== 'string' || trimmedName.length < 2 || trimmedName.length > 50) {
      console.error('❌ Invalid name format:', { name: trimmedName, length: trimmedName.length });
      toast.error('Invalid name format');
      return;
    }
    
    if (typeof normalizedEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      console.error('❌ Invalid email format:', { email: normalizedEmail });
      toast.error('Invalid email format');
      return;
    }
    
    if (typeof formData.password !== 'string' || formData.password.length < 6) {
      console.error('❌ Invalid password format');
      toast.error('Invalid password format');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      console.error('❌ Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    if (!agreeTerms) {
      console.error('❌ Terms not agreed');
      toast.error('You must agree to the Terms and Conditions');
      return;
    }
    
    console.log('✅ All validation checks passed - sending to backend...');
    setIsLoading(true);

    try {
      // Prepare validated data for backend
      const validatedData = {
        name: trimmedName,
        email: normalizedEmail,
        password: formData.password, // Keep original password (don't trim)
      };
      
      // Log the data being sent (remove in production)
      console.log('Submitting data:', { 
        name: validatedData.name, 
        email: validatedData.email, 
        passwordLength: validatedData.password.length 
      });
      
      // Call the actual register function
      await register(validatedData);
      
      toast.success('Account created successfully!');
      router.push('/playground');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">AI Playground</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white ${
                    errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {errors.password && (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  {(() => {
                    const strength = getPasswordStrength(formData.password);
                    return (
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Password strength:</span>
                          <span className={`font-medium ${
                            strength.color === 'red' ? 'text-red-600' :
                            strength.color === 'yellow' ? 'text-yellow-600' :
                            strength.color === 'blue' ? 'text-blue-600' :
                            'text-green-600'
                          }`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="mt-1 bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              strength.color === 'red' ? 'bg-red-500' :
                              strength.color === 'yellow' ? 'bg-yellow-500' :
                              strength.color === 'blue' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(strength.score / 6) * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {strength.requirements.map((req, index) => (
                            <div key={index} className="flex items-center text-xs">
                              <div className={`w-3 h-3 rounded-full mr-2 flex items-center justify-center ${
                                req.met ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {req.met && <span className="text-white text-xs">✓</span>}
                              </div>
                              <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {errors.confirmPassword && (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    // Clear terms error when user checks the box
                    if (e.target.checked && errors.terms) {
                      const newErrors = { ...errors };
                      delete newErrors.terms;
                      setErrors(newErrors);
                    }
                  }}
                  onBlur={() => {
                    setTouched({ ...touched, terms: true });
                    if (!agreeTerms) {
                      setErrors({ ...errors, terms: 'You must agree to the Terms and Conditions' });
                    }
                  }}
                  required
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    errors.terms ? 'border-red-300' : ''
                  }`}
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
              )}
            </div>

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Please fix the following errors:
                    </h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {Object.values(errors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || Object.keys(errors).length > 0}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading || Object.keys(errors).length > 0
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
