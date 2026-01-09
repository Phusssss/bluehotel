import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGuestsAndReservations1704792000000 implements MigrationInterface {
    name = 'CreateGuestsAndReservations1704792000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create guests table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS guests (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                nationality VARCHAR(100),
                passport_number VARCHAR(50) UNIQUE,
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                preferences JSON,
                is_vip BOOLEAN DEFAULT FALSE,
                loyalty_points INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_email (email),
                INDEX idx_phone (phone),
                INDEX idx_is_vip (is_vip),
                INDEX idx_passport (passport_number)
            )
        `);

        // Create reservations table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                guest_id BIGINT NOT NULL,
                room_id BIGINT NOT NULL,
                check_in_date DATE NOT NULL,
                check_out_date DATE NOT NULL,
                number_of_guests INT NOT NULL,
                status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
                room_rate DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                special_requests TEXT,
                source ENUM('direct', 'booking.com', 'agoda', 'airbnb', 'phone', 'email') DEFAULT 'direct',
                booking_reference VARCHAR(50),
                created_by_id BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                FOREIGN KEY (guest_id) REFERENCES guests(id),
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (created_by_id) REFERENCES users(id),
                INDEX idx_status (status),
                INDEX idx_check_in_date (check_in_date),
                INDEX idx_check_out_date (check_out_date),
                INDEX idx_guest_id (guest_id),
                INDEX idx_room_id (room_id),
                INDEX idx_source (source),
                INDEX idx_dates (check_in_date, check_out_date),
                INDEX idx_booking_reference (booking_reference)
            )
        `);

        // Insert sample guests
        await queryRunner.query(`
            INSERT INTO guests (first_name, last_name, email, phone, nationality, passport_number, gender, is_vip) VALUES
            ('Nguyễn', 'Văn An', 'nguyenvanan@email.com', '0901234567', 'Vietnam', 'VN123456789', 'male', false),
            ('Trần', 'Thị Bình', 'tranthibinh@email.com', '0907654321', 'Vietnam', 'VN987654321', 'female', true),
            ('Lê', 'Minh Cường', 'leminhcuong@email.com', '0912345678', 'Vietnam', 'VN456789123', 'male', false),
            ('John', 'Smith', 'john.smith@email.com', '+1234567890', 'USA', 'US123456789', 'male', false),
            ('Sarah', 'Johnson', 'sarah.johnson@email.com', '+1987654321', 'USA', 'US987654321', 'female', true)
        `);

        // Insert sample reservations
        await queryRunner.query(`
            INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, number_of_guests, status, room_rate, total_price, booking_reference, created_by_id) VALUES
            (1, 1, '2026-01-15', '2026-01-17', 1, 'confirmed', 500000.00, 1000000.00, 'HTL-2026-001', 1),
            (2, 6, '2026-01-20', '2026-01-23', 2, 'confirmed', 2000000.00, 6000000.00, 'HTL-2026-002', 1),
            (3, 3, '2026-01-25', '2026-01-27', 2, 'pending', 800000.00, 1600000.00, 'HTL-2026-003', 1)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS reservations`);
        await queryRunner.query(`DROP TABLE IF EXISTS guests`);
    }
}