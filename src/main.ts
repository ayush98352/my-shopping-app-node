import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
// import { AppService } from './app.service';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from './config/config.service';
import { urlencoded, json } from 'express';
import * as csurf from 'csurf';

import { config } from 'dotenv';


async function bootstrap() {
  config(); // Load environment variables


  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  const configService = new ConfigService('.env');
  app.enableCors({
    origin: [
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-XSRF-TOKEN',
      'access-control-allow-methods',
      'Access-Control-Allow-Origin',
      'access-control-allow-credentials',
      'access-control-allow-headers',
      'Access-Control-Request-Headers'
    ],
    credentials: true,
  });
  app.use(cookieParser());
  app.use(helmet());
  app.use(
    urlencoded({ extended: true, limit: '50mb', parameterLimit: 100000 }),
  );
 
  // app.use(csurf({ cookie: { httpOnly: true } }));


  const disabled_csrf_paths:string[] = [
  ]
 
 
  app.use((req, res, next) => {
    if (!disabled_csrf_paths.includes(req.path) && !req.path.includes('/staffing-module')) {  
      csurf({ cookie: { httpOnly: true } })(req, res, next);
    }
    else {
      next();
    }
  });


  app.use(json({ limit: '50mb' }));

  // CSRF protection middleware
  app.use(csurf({ cookie: true }));


  //app.setGlobalPrefix(configService.get('GLOBAL_PREFIX'));


  const port = process.env.PORT || '7399';


  const httpServer = await app.listen(port, () =>
    console.log('App is listening on port ' + port),
  );  


  httpServer.setTimeout(1800000);
}
bootstrap();
