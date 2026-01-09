-- Create database if not exists
CREATE DATABASE IF NOT EXISTS hotel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE hotel_management;

-- Create a test table to verify connection
CREATE TABLE IF NOT EXISTS connection_test (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO connection_test (message) VALUES ('Database connection successful');

-- Grant privileges
GRANT ALL PRIVILEGES ON hotel_management.* TO 'hotel_user'@'%';
FLUSH PRIVILEGES;