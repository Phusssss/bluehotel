import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../entities/User';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export class JwtUtils {
  static generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '24h',
      issuer: 'hotel-management-api',
      subject: user.id.toString()
    });
  }

  static generateRefreshToken(): string {
    return jwt.sign({}, config.jwt.refreshSecret, {
      expiresIn: '7d'
    });
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): any {
    return jwt.verify(token, config.jwt.refreshSecret);
  }
}