import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserStatus } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { JwtUtils } from '../utils/jwt';
import { HashUtils } from '../utils/hash';
import { AppError } from '../utils/errors';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phone?: string;
    role: string;
    status: string;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    fullName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private refreshTokenRepository: Repository<RefreshToken>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  }

  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email }
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

    // Generate tokens
    const accessToken = JwtUtils.generateAccessToken(user);
    const refreshToken = JwtUtils.generateRefreshToken();

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    // Update last login
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        fullName: user.fullName
      },
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
        relations: ['user']
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new AppError('Invalid refresh token', 401);
      }

      const user = tokenRecord.user;

      // Generate new tokens
      const newAccessToken = JwtUtils.generateAccessToken(user);
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