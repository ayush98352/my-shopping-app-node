import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { CommonLogicModule } from 'src/common-logic/common-logic.module';

@Module({
  imports: [CommonLogicModule],
  controllers: [HomeController],
  providers: [HomeService]
})
export class HomeModule {}
