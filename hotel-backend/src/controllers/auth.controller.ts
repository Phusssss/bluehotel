import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    const result = await this.authService.login({ email, password });
    
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