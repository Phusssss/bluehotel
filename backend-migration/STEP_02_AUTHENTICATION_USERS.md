# 🔐 STEP 2: AUTHENTICATION & USERS (Weeks 3-4)

## I. OVERVIEW

**Duration**: 2 weeks  
**Team**: 1 Backend Lead + 1 Backend Developer  
**Goal**: Implement JWT authentication and user management system

---

## II. TASKS CHECKLIST

### Week 3: JWT Authentication
- [ ] Implement JWT token generation
- [ ] Create refresh token system
- [ ] Build auth middleware
- [ ] Create login/logout endpoints
- [ ] Add password hashing (bcrypt)
- [ ] Setup role-based access control (RBAC)

### Week 4: User Management
- [ ] Create User entity and repository
- [ ] Build user CRUD operations
- [ ] Implement permission system
- [ ] Add user validation
- [ ] Create user management APIs
- [ ] Write comprehensive tests

---

## III. DATABASE SCHEMA

### Users Table
```sql
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
);
```

### User Permissions Table
```sql
CREATE TABLE user_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission),
  INDEX idx_user_id (user_id)
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

---

## IV. IMPLEMENTATION

### 1. User Entity
```typescript
// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { UserPermission } from './UserPermission';
import { RefreshToken } from './RefreshToken';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  RECEPTIONIST = 'receptionist',
  HOUSEKEEPER = 'housekeeper',
  MAINTENANCE = 'maintenance',
  STAFF = 'staff'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ name: 'last_login', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => UserPermission, permission => permission.user)
  permissions: UserPermission[];

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens: RefreshToken[];

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
}
```

### 2. JWT Utilities
```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../entities/User';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
}

export class JwtUtils {
  static generateAccessToken(user: User, permissions: string[]): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'hotel-management-api',
      subject: user.id.toString()
    });
  }

  static generateRefreshToken(): string {
    return jwt.sign({}, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): any {
    return jwt.verify(token, config.jwt.refreshSecret);
  }
}
```

### 3. Password Hashing
```typescript
// src/utils/hash.ts
import bcrypt from 'bcryptjs';

export class HashUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### 4. Auth Service
```typescript
// src/services/auth.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserStatus } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { UserPermission } from '../entities/UserPermission';
import { JwtUtils } from '../utils/jwt';
import { HashUtils } from '../utils/hash';
import { AppError } from '../utils/errors';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private refreshTokenRepository: Repository<RefreshToken>;
  private permissionRepository: Repository<UserPermission>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    this.permissionRepository = AppDataSource.getRepository(UserPermission);
  }

  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['permissions']
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError('Account is inactive', 401);
    }

    // Verify password
    const isPasswordValid = await HashUtils.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Get user permissions
    const permissions = user.permissions.map(p => p.permission);

    // Generate tokens
    const accessToken = JwtUtils.generateAccessToken(user, permissions);
    const refreshToken = JwtUtils.generateRefreshToken();

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    // Update last login
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      JwtUtils.verifyRefreshToken(refreshToken);

      // Find refresh token in database
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
        relations: ['user', 'user.permissions']
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new AppError('Invalid refresh token', 401);
      }

      const user = tokenRecord.user;
      const permissions = user.permissions.map(p => p.permission);

      // Generate new tokens
      const newAccessToken = JwtUtils.generateAccessToken(user, permissions);
      const newRefreshToken = JwtUtils.generateRefreshToken();

      // Replace old refresh token
      await this.refreshTokenRepository.delete({ token: refreshToken });
      await this.saveRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }

  private async saveRefreshToken(userId: number, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt
    });

    await this.refreshTokenRepository.save(refreshToken);
  }
}
```

### 5. Auth Controller
```typescript
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validateLoginRequest } from '../validators/auth.validator';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const loginData = validateLoginRequest(req.body);
    const result = await this.authService.login(loginData);
    
    res.json({
      success: true,
      data: result
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    const result = await this.authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      data: result
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  };
}
```

### 6. Auth Middleware
```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JwtUtils, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.substring(7);
    const payload = JwtUtils.verifyAccessToken(token);
    
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user.permissions.includes(permission)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }
    
    next();
  };
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!roles.includes(user.role)) {
      next(new AppError('Insufficient role permissions', 403));
      return;
    }
    
    next();
  };
};
```

---

## V. API ENDPOINTS

### Auth Routes
```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
```

### API Documentation
```
POST   /api/auth/login                 - User login
POST   /api/auth/refresh               - Refresh JWT token
POST   /api/auth/logout                - User logout
```

---

## VI. TESTING

### Unit Tests
```typescript
// tests/services/auth.service.test.ts
import { AuthService } from '../../src/services/auth.service';
import { User, UserStatus } from '../../src/entities/User';
import { HashUtils } from '../../src/utils/hash';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'admin@hotel.com',
        password: 'admin123'
      };

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginData.email);
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'invalid@hotel.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(loginData))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Integration Tests
```typescript
// tests/controllers/auth.controller.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Auth Controller', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@hotel.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@hotel.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## VII. SUCCESS CRITERIA

- [ ] JWT authentication working
- [ ] Refresh token system functional
- [ ] Password hashing implemented
- [ ] Role-based access control working
- [ ] Auth middleware protecting routes
- [ ] User login/logout working
- [ ] All tests passing (>80% coverage)
- [ ] API documentation complete

---

## VIII. NEXT STEPS

After completing this step:
1. Move to **STEP 3: Room Management APIs**
2. Implement room CRUD operations
3. Add real-time room status updates
4. Create housekeeping integration