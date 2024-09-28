import { Module, OnModuleInit } from '@nestjs/common';
import { MysqlConnService } from './mysql-conn.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormConfig, { getHosts } from '../config/orm.config';

const databasesConfig = getHosts().map((hostIp) => {
  return TypeOrmModule.forRootAsync({
    name: `server-${hostIp}`,
    imports: [ConfigModule.forFeature(ormConfig)],
    useFactory: (config: ConfigService) => config.get(`orm.${hostIp}`),
    inject: [ConfigService],
  });
});

@Module({
    imports: [
        ConfigModule.forRoot({
           isGlobal: true,
        }),
        ...databasesConfig,
    ],
    providers: [MysqlConnService],
    exports: [MysqlConnService],
})
export class MysqlConnModule {
    constructor(private mysqlService: MysqlConnService) {getHosts()}
}
