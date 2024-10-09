import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { CommonLogicModule } from 'src/common-logic/common-logic.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [CommonLogicModule, JwtModule],
  controllers: [HomeController],
  providers: [HomeService]
})
export class HomeModule {}
