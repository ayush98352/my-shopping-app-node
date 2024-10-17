import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { CommonLogicModule } from 'src/common-logic/common-logic.module';
import { JwtModule } from '@nestjs/jwt';
// import { HttpService } from '@nestjs/axios';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CommonLogicModule, JwtModule, HttpModule],
  controllers: [HomeController],
  providers: [HomeService]
})
export class HomeModule {}
