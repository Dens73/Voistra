import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { APP_ENTITIES } from './entities';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'diploma_voip',
  entities: APP_ENTITIES,
  migrations: [__dirname + '/migrations/*{.js,.ts}'],
  synchronize: false,
});
