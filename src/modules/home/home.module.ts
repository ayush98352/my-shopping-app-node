import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { TranslationService } from './translation.service';
import { CommonLogicModule } from 'src/common-logic/common-logic.module';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Module({
  imports: [CommonLogicModule, JwtModule, HttpModule],
  controllers: [HomeController],
  providers: [HomeService, TranslationService, JwtAuthGuard],
  exports: [TranslationService],
})
export class HomeModule {}
