import { Module } from '@nestjs/common';
import { CsrfController } from './csrf.controller';


@Module({
    imports: [],
  controllers: [CsrfController],
  providers: []
})
export class CsrfModule {}
