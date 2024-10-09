import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // Method to generate a JWT token
  generateToken(userId: string) {
    const payload = { userId };
    console.log('payload', payload);
    return this.jwtService.sign(payload);
  }

  // You can add more methods for validating users, etc.
}
