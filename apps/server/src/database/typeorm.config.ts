import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { APP_ENTITIES } from './entities';

export function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const dbType = configService.get<string>('DB_TYPE', 'sqljs');
  const synchronize = configService.get<string>(
    'DB_SYNCHRONIZE',
    dbType === 'sqljs' ? 'true' : 'false',
  ) === 'true';

  if (dbType === 'sqljs') {
    return {
      type: 'sqljs',
      location: configService.get<string>('DB_FILE', 'diploma-voip.sqlite'),
      autoSave: true,
      autoLoadEntities: true,
      synchronize,
      entities: APP_ENTITIES,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: Number(configService.get<string>('DB_PORT', '5432')),
    username: configService.get<string>('DB_USER', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'diploma_voip'),
    autoLoadEntities: true,
    synchronize,
    migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN', 'false') === 'true',
    entities: APP_ENTITIES,
    migrations: [__dirname + '/migrations/*{.js,.ts}'],
  };
}
