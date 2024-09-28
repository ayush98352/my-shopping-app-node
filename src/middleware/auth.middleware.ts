import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// import { AuthService } from '../auth/auth.service';
// import jwt_decode from 'jwt-decode';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    // constructor(private readonly authService: AuthService){}
    async use(request: Request, response: Response, next: NextFunction) {
        console.log('Request...');
        next();
    }
}