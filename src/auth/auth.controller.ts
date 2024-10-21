import { Controller, Post, Body, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import * as csurf from 'csurf';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // Send the CSRF token to the client
    res.json({ csrfToken: req.csrfToken() });
  }

  @Post('login')
  async login(@Body() loginDto: { userId: string }) {
    const token = this.authService.generateToken(loginDto.userId);
    return { token };
  }
}
