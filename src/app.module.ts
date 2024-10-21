import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonLogicModule } from './common-logic/common-logic.module';
import { MysqlConnModule } from './mysql-conn/mysql-conn.module';
import { HomeModule } from './modules/home/home.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthMiddleware } from './middleware/auth.middleware';
import { PaymentModule } from './modules/payment/payment.module';
// import { CsrfModule } from './_csrf/csrf.module';


@Module({
  imports: [ 
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
            const secret = configService.get<string>('JWT_SECRET');
            return {
                secret,
                signOptions: { expiresIn: '60s' },
            };
        },
        inject: [ConfigService],
    }),
    CommonLogicModule,
    MysqlConnModule,
    HomeModule,
    AuthModule,
    PaymentModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/');
  }
}

