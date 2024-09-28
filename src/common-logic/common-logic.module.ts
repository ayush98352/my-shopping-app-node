import { Module } from '@nestjs/common';
import { CommonLogicService } from './common-logic.service';
import { MysqlConnModule } from '../mysql-conn/mysql-conn.module';

@Module({
  imports: [MysqlConnModule],
  providers: [CommonLogicService],
  exports: [CommonLogicService]
})
export class CommonLogicModule {}
