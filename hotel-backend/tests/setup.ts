// Test setup file
import 'reflect-metadata';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_NAME = 'hotel_management_test';

// Increase timeout for database operations
jest.setTimeout(10000);