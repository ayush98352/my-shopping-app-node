import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export const getHosts = (): string[] => {

  return process.env.MYSQL_HOSTS.split(',');
};

export default registerAs('orm', () => {
  const config = {};
  
  getHosts().forEach((server) => {
    let server_name = server;
    if(process.env.NODE_ENV==undefined && server == '127.0.0.1'){
      server_name = 'DB_CONN';
    }
    const mysql_cred= JSON.parse(process.env[server_name]);
    config[server] = {
      type: 'mysql',
      host: mysql_cred['host'],
      port: '3306',
      username: mysql_cred['username'],
      password: mysql_cred['password'],
      synchronize: 'true',
      entities: ["src/*/*.entity{.ts,.js}"],
    };
  });

  return config;
});
