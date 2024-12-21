import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
// import { AppService } from './app.service';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from './config/config.service';
import { urlencoded, json } from 'express';
import * as csurf from 'csurf';

import { config } from 'dotenv';
import { Request, Response } from 'express'; // Import types
import { AuthMiddleware } from './middleware/auth.middleware'; // Update with the correct path



async function bootstrap() {
  config(); // Load environment variables
 

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  // const configService = new ConfigService('.env');
  const csrfProtection = csurf({ cookie: { httpOnly: true } });
    
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://lovely-sorbet-eaaf67.netlify.app/',
      'https://lovely-sorbet-eaaf67.netlify.app',
      'https://localhost',
      'capacitor://localhost'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'Access-Control-Allow-Origin'
    ],
    credentials: true,
  });

  app.use(cookieParser());
  app.use(helmet());
  app.use(json({ limit: '50mb' }));

  // app.use(
  //   urlencoded({ extended: true, limit: '50mb', parameterLimit: 100000 }),
  // );
 
  // app.use(csurf({ cookie: { httpOnly: true } }));
  
   // Apply CSRF protection middleware
  //  app.use(csrfProtection);

  

   app.use((req: Request, res: Response, next) => {
    // console.log('Incoming CSRF Token:', req.headers['x-csrf-token']);
    // console.log('CSRF Token from Cookie:', req.cookies['_csrf']);
    csrfProtection(req, res, (err) => {
      // if (err) {
      //   console.log('CSRF Protection Error:', err);
      //   return res.status(403).send('Forbidden');
      // }
      next();
    });
  });
  
  // app.use((req, res, next) => {
  //   console.log('Incoming request origin:', req.headers.origin);
  //   next();
  // });


   // Endpoint to get CSRF token
  //  app.get('/csrf-token', (req: Request, res: Response) => {
  //   res.json({ csrfToken: req.csrfToken() });
  // });

  // app.use(csrfProtection); // Apply CSRF middleware
  // app.get('/csrf-token', (req: Request, res: Response) => {
  //   res.json({ csrfToken: req.csrfToken() });
  // });
  
  // // Define a simple route handler
  // app.get('/csrf-token', (req: Request, res: Response) => {
  //   res.json({ csrfToken: req.csrfToken() });
  // });
  
    // Apply AuthMiddleware
  // app.use(new AuthMiddleware().use); // This is for global middleware


  
 
  // app.use((req: Request, res: Response, next) => {
  //   console.log('Cookie:', req.cookies); 
  //   console.log('CSRF Token:', req.headers['x-csrf-token']); 
  //   csrfProtection(req, res, (err) => {
  //     // if (err) {
  //     //   return res.status(403).send('Forbidden');
  //     // }
  //     console.log('err', err);
  //     next();
  //   });
  // });

  // app.use(json({ limit: '50mb' }));

  // CSRF protection middleware
  // app.use(csurf({ cookie: true }));


  //app.setGlobalPrefix(configService.get('GLOBAL_PREFIX'));


  const port = process.env.PORT || '7399';





  const httpServer = await app.listen(port, () =>
    console.log('App is listening on port ' + port),
    
  );  
  // if(process.env.NODE_ENV === 'production') {
  //   console.log('prod')
  // } else {
  //   console.log('dev')
  // }  


  httpServer.setTimeout(1800000);
}
bootstrap();
