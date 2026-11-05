import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { OrdersModule } from './orders/orders.module';
import { CountersModule } from './counters/counters.module';
import { ReturnsModule } from './returns/returns.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 3306)),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASS', ''),
        database: config.get<string>('DB_NAME', 'retail_pos'),
        charset: 'utf8mb4',
        autoLoadEntities: true,
        synchronize: true, // local development only: auto-creates and alters tables
      }),
    }),
    AuthModule,
    RolesModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    SalesModule,
    OrdersModule,
    CountersModule,
    ReturnsModule,
  ],
})
export class AppModule {}
