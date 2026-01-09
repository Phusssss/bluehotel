import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoomTables1704791000000 implements MigrationInterface {
    name = 'CreateRoomTables1704791000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create room_types table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS room_types (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                name_vi VARCHAR(100) NOT NULL,
                name_en VARCHAR(100),
                description TEXT,
                capacity INT NOT NULL,
                price_per_night DECIMAL(10, 2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_capacity (capacity),
                INDEX idx_is_active (is_active)
            )
        `);

        // Create rooms table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                room_number VARCHAR(20) UNIQUE NOT NULL,
                room_type_id BIGINT NOT NULL,
                floor INT,
                status ENUM('available', 'occupied', 'dirty', 'cleaning', 'maintenance') DEFAULT 'available',
                current_guest_id BIGINT,
                check_out_time DATETIME,
                housekeeping_notes TEXT,
                last_updated DATETIME,
                updated_by_id BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (room_type_id) REFERENCES room_types(id),
                FOREIGN KEY (updated_by_id) REFERENCES users(id),
                INDEX idx_room_number (room_number),
                INDEX idx_status (status),
                INDEX idx_floor (floor),
                INDEX idx_current_guest_id (current_guest_id)
            )
        `);

        // Insert sample room types
        await queryRunner.query(`
            INSERT INTO room_types (name_vi, name_en, description, capacity, price_per_night) VALUES
            ('Phòng Đơn', 'Single Room', 'Phòng đơn tiêu chuẩn với 1 giường đơn', 1, 500000.00),
            ('Phòng Đôi', 'Double Room', 'Phòng đôi với 1 giường đôi', 2, 800000.00),
            ('Phòng Gia Đình', 'Family Room', 'Phòng gia đình với 2 giường đôi', 4, 1200000.00),
            ('Phòng VIP', 'VIP Suite', 'Phòng VIP cao cấp với đầy đủ tiện nghi', 2, 2000000.00)
        `);

        // Insert sample rooms
        await queryRunner.query(`
            INSERT INTO rooms (room_number, room_type_id, floor, status) VALUES
            ('101', 1, 1, 'available'),
            ('102', 1, 1, 'available'),
            ('103', 2, 1, 'available'),
            ('201', 2, 2, 'available'),
            ('202', 3, 2, 'available'),
            ('301', 4, 3, 'available')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE rooms`);
        await queryRunner.query(`DROP TABLE room_types`);
    }
}