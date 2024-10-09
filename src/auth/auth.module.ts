import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [ JwtModule],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController], // Export AuthService and JwtModule for use in other modules
})
export class AuthModule {}
