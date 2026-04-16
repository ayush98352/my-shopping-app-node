import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonLogicModule } from './common-logic/common-logic.module';
import { MysqlConnModule } from './mysql-conn/mysql-conn.module';
import { HomeModule } from './modules/home/home.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthMiddleware } from './middleware/auth.middleware';
import { PaymentModule } from './modules/payment/payment.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
// import { CsrfModule } from './_csrf/csrf.module';


@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
        global: true,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
            const secret = configService.get<string>('JWT_SECRET');
            return {
                secret,
                signOptions: { expiresIn: '7d' },
            };
        },
        inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    CommonLogicModule,
    MysqlConnModule,
    HomeModule,
    AuthModule,
    PaymentModule, 
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/');
  }
}

