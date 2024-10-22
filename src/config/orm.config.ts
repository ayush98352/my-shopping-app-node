import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export const getHosts = (): string[] => {
  const hosts = process.env.MYSQL_HOSTS;

  if (!hosts) {
    throw new Error('MYSQL_HOSTS environment variable is not defined');
  }

  return hosts.split(',');  // Will split if there are multiple hosts, but in this case, you're using a single value
};

export default registerAs('orm', () => {
  const config = {};

  getHosts().forEach((server) => {
    let server_name = server;

    // Handle local DB connection when running in development mode
    if (server === 'DB_CONN') {
      server_name = 'DB_CONN';
    } else {
      // Handle Railway DB connection for production/staging
      server_name = 'RAILWAY_CONN';
    }

    const mysql_cred = JSON.parse(process.env[server_name]);

    config[server] = {
      type: 'mysql',
      host: mysql_cred['host'] || 'localhost', // Fallback to localhost
      port: mysql_cred['port'] || 3306, // Default MySQL port
      username: mysql_cred['username'] || 'root', // Default username
      password: mysql_cred['password'] || '', // Default empty password
      database: mysql_cred['database'] || '', // Ensure a database name
      synchronize: true, // Set this to false in production
      entities: ["src/**/*.entity{.ts,.js}"],  // Path to your entities
    };
  });

  // getHosts().forEach((server) => {
  //   let server_name = server;
  //   if(process.env.NODE_ENV==undefined && server == '127.0.0.1'){
  //     server_name = 'DB_CONN';
  //   }
  //   const mysql_cred= JSON.parse(process.env[server_name]);
  //   config[server] = {
  //     type: 'mysql',
  //     host: mysql_cred['host'],
  //     port: '3306',
  //     username: mysql_cred['username'],
  //     password: mysql_cred['password'],
  //     synchronize: 'true',
  //     entities: ["src/*/*.entity{.ts,.js}"],
  //   };
  // });

  return config;
});
