import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { AuthService } from './auth/auth.service';
import { AuthMiddleware } from './middleware/auth.middleware';
import { CommonLogicModule } from './common-logic/common-logic.module';
import  { MysqlConnModule } from './mysql-conn/mysql-conn.module';
import { ConfigModule } from './config/config.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [CommonLogicModule, MysqlConnModule, ConfigModule, HomeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/');
  }
}
