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


// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import * as csurf from 'csurf';

// @Injectable()
// export class AuthMiddleware implements NestMiddleware {
//   private csrfProtection = csurf({ cookie: { httpOnly: true } });

//   constructor() {
//     this.use = this.use.bind(this); // Bind the method to the class instance
//   }

//   async use(request: Request, response: Response, next: NextFunction) {
//     console.log('Request...');
//     this.csrfProtection(request, response, (err) => {
//       if (err) {
//         return response.status(403).send('Forbidden');
//       }
//       console.log('ayush')
//       next();
//     });
//   }

  
// }
