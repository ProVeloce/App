import { body, param, query, ValidationChain } from 'express-validator';

// ============================================
// AUTH VALIDATORS
// ============================================

export const signupValidator: ValidationChain[] = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
];

export const loginValidator: ValidationChain[] = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator: ValidationChain[] = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
];

export const resetPasswordValidator: ValidationChain[] = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
];

export const verifyOtpValidator: ValidationChain[] = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(['email_verification', 'phone_verification', 'password_reset']).withMessage('Invalid OTP type'),
];

export const changePasswordValidator: ValidationChain[] = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
];

// ============================================
// USER VALIDATORS
// ============================================

export const updateProfileValidator: ValidationChain[] = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('dob')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
    body('addressLine1')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Address too long'),
    body('city')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('City name too long'),
    body('state')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('State name too long'),
    body('country')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Country name too long'),
    body('pincode')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Pincode too long'),
];

// ============================================
// EXPERT APPLICATION VALIDATORS
// ============================================

export const expertApplicationValidator: ValidationChain[] = [
    body('dob')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('domains')
        .optional()
        .isArray().withMessage('Domains must be an array'),
    body('yearsOfExperience')
        .optional()
        .isInt({ min: 0, max: 50 }).withMessage('Years of experience must be between 0-50'),
    body('summaryBio')
        .optional()
        .isLength({ min: 100 }).withMessage('Bio must be at least 100 characters'),
    body('skills')
        .optional()
        .isArray().withMessage('Skills must be an array'),
    body('hourlyRate')
        .optional()
        .isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
    body('projectRate')
        .optional()
        .isFloat({ min: 0 }).withMessage('Project rate must be a positive number'),
    body('references')
        .optional()
        .isArray({ min: 2 }).withMessage('At least 2 references are required'),
    body('references.*.name')
        .optional()
        .notEmpty().withMessage('Reference name is required'),
    body('references.*.phone')
        .optional()
        .notEmpty().withMessage('Reference phone is required'),
    body('references.*.email')
        .optional()
        .isEmail().withMessage('Invalid reference email'),
    body('termsAccepted')
        .optional()
        .isBoolean().withMessage('Terms acceptance must be boolean'),
    body('ndaAccepted')
        .optional()
        .isBoolean().withMessage('NDA acceptance must be boolean'),
];

// ============================================
// TASK VALIDATORS
// ============================================

export const createTaskValidator: ValidationChain[] = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title too long'),
    body('description')
        .optional()
        .trim(),
    body('deadline')
        .optional()
        .isISO8601().withMessage('Invalid deadline format'),
    body('assignedToId')
        .notEmpty().withMessage('Assignee is required')
        .isMongoId().withMessage('Invalid assignee ID'),
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
];

export const taskSubmissionValidator: ValidationChain[] = [
    body('message')
        .optional()
        .trim(),
];

// ============================================
// TICKET VALIDATORS
// ============================================

export const createTicketValidator: ValidationChain[] = [
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['TECHNICAL', 'BILLING', 'VERIFICATION', 'OTHER']).withMessage('Invalid category'),
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .isLength({ max: 255 }).withMessage('Subject too long'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),
];

export const ticketMessageValidator: ValidationChain[] = [
    body('content')
        .trim()
        .notEmpty().withMessage('Message content is required'),
];

// ============================================
// PAGINATION VALIDATORS
// ============================================

export const paginationValidator: ValidationChain[] = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('sortBy')
        .optional()
        .trim(),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

// ============================================
// UUID VALIDATOR
// ============================================

export const uuidParamValidator = (paramName: string): ValidationChain[] => [
    param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName} format`),
];
