import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndRefreshTokens1704790800000 implements MigrationInterface {
    name = 'CreateUsersAndRefreshTokens1704790800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE users (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                avatar_url VARCHAR(500),
                phone VARCHAR(20),
                role ENUM('admin', 'manager', 'receptionist', 'housekeeper', 'maintenance', 'staff') NOT NULL DEFAULT 'staff',
                status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_role (role)
            )
        `);

        // Create refresh_tokens table
        await queryRunner.query(`
            CREATE TABLE refresh_tokens (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                token VARCHAR(500) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            )
        `);

        // Insert default admin user
        await queryRunner.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role, status) 
            VALUES (
                'admin@hotel.com', 
                '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 
                'Admin', 
                'User', 
                'admin', 
                'active'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE refresh_tokens`);
        await queryRunner.query(`DROP TABLE users`);
    }
}