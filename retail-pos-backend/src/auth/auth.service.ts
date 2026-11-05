import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ALL_SYSTEM_PERMISSIONS,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
} from './auth.constants';
import { comparePassword, hashPassword, signJwt, verifyJwt } from './auth.crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedSuperAdminAndRoles();
  }

  private async seedSuperAdminAndRoles() {
    try {
      // 1. Seed or retrieve System Roles
      let superAdminRole = await this.roleRepo.findOne({ where: { slug: 'super_admin' } });
      if (!superAdminRole) {
        superAdminRole = this.roleRepo.create({
          name: 'Super Admin',
          slug: 'super_admin',
          description: 'Full unrestricted system access and management',
          permissions: ALL_SYSTEM_PERMISSIONS,
          isSystem: true,
        });
        await this.roleRepo.save(superAdminRole);
        this.logger.log('Seeded Role: Super Admin');
      }

      let managerRole = await this.roleRepo.findOne({ where: { slug: 'manager' } });
      if (!managerRole) {
        managerRole = this.roleRepo.create({
          name: 'Store Manager',
          slug: 'manager',
          description: 'Store operations, inventory, orders and returns',
          permissions: ALL_SYSTEM_PERMISSIONS.filter(
            (p) => !p.startsWith('roles:') && !p.startsWith('users:delete'),
          ),
          isSystem: true,
        });
        await this.roleRepo.save(managerRole);
        this.logger.log('Seeded Role: Store Manager');
      }

      let cashierRole = await this.roleRepo.findOne({ where: { slug: 'cashier' } });
      if (!cashierRole) {
        cashierRole = this.roleRepo.create({
          name: 'Cashier',
          slug: 'cashier',
          description: 'POS sales terminal, customer lookup, returns and counter shift operations',
          permissions: [
            'pos:access',
            'products:view',
            'orders:view',
            'orders:create',
            'counters:view',
            'counters:update',
            'returns:view',
            'returns:create',
            'customers:view',
            'customers:create',
          ],
          isSystem: true,
        });
        await this.roleRepo.save(cashierRole);
        this.logger.log('Seeded Role: Cashier');
      }

      // 2. Seed Super Admin user from .env
      const superAdminEmail = (
        process.env.SUPERADMIN_EMAIL || 'superadmin@retailpos.com'
      ).toLowerCase().trim();
      const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';

      let superAdmin = await this.userRepo.findOne({ where: { email: superAdminEmail } });
      if (!superAdmin) {
        superAdmin = this.userRepo.create({
          name: 'Super Admin',
          email: superAdminEmail,
          password: hashPassword(superAdminPassword),
          roleId: superAdminRole.id,
          roleEntity: superAdminRole,
          role: 'super_admin',
          isActive: true,
          isSuperAdmin: true,
          mustChangePassword: false,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        });
        await this.userRepo.save(superAdmin);
        this.logger.log(`Super Admin user created: ${superAdminEmail}`);
      }

      // 3. Ensure a Cashier exists for testing
      const cashierEmail = 'cashier@retailpos.com';
      let cashier = await this.userRepo.findOne({ where: { email: cashierEmail } });
      if (!cashier) {
        cashier = this.userRepo.create({
          name: 'Nayem Cashier',
          email: cashierEmail,
          password: hashPassword('cashier123'),
          roleId: cashierRole.id,
          roleEntity: cashierRole,
          role: 'cashier',
          isActive: true,
          isSuperAdmin: false,
          mustChangePassword: false,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        });
        await this.userRepo.save(cashier);
        this.logger.log('Default Cashier created: cashier@retailpos.com');
      }
    } catch (err: any) {
      this.logger.error(`Error during Super Admin seeding: ${err.message}`);
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email },
      relations: { roleEntity: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is deactivated. Contact administrator.');
    }

    const isMatch = comparePassword(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Determine permissions
    let permissions: string[] = [];
    if (user.isSuperAdmin) {
      permissions = ALL_SYSTEM_PERMISSIONS;
    } else if (user.roleEntity?.permissions) {
      permissions = user.roleEntity.permissions;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      permissions,
    };

    const accessToken = signJwt(payload, JWT_SECRET, ACCESS_TOKEN_EXPIRES_IN);
    const refreshToken = signJwt({ sub: user.id, type: 'refresh' }, JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN);

    user.refreshToken = refreshToken;
    await this.userRepo.save(user);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        mustChangePassword: user.mustChangePassword,
        avatar: user.avatar,
      },
      permissions,
    };
  }

  async logout(userId?: number, refreshToken?: string) {
    if (userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        user.refreshToken = null;
        await this.userRepo.save(user);
      }
    } else if (refreshToken) {
      const user = await this.userRepo.findOne({ where: { refreshToken } });
      if (user) {
        user.refreshToken = null;
        await this.userRepo.save(user);
      }
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { roleEntity: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    let permissions: string[] = [];
    if (user.isSuperAdmin) {
      permissions = ALL_SYSTEM_PERMISSIONS;
    } else if (user.roleEntity?.permissions) {
      permissions = user.roleEntity.permissions;
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        mustChangePassword: user.mustChangePassword,
        avatar: user.avatar,
      },
      permissions,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = comparePassword(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    user.password = hashPassword(dto.newPassword);
    user.mustChangePassword = false; // Successfully changed temporary password!
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    let payload: any;
    try {
      payload = verifyJwt(refreshToken, JWT_SECRET);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: { roleEntity: true },
    });

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token has expired or is invalid');
    }

    let permissions: string[] = [];
    if (user.isSuperAdmin) {
      permissions = ALL_SYSTEM_PERMISSIONS;
    } else if (user.roleEntity?.permissions) {
      permissions = user.roleEntity.permissions;
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      permissions,
    };

    const newAccessToken = signJwt(newPayload, JWT_SECRET, ACCESS_TOKEN_EXPIRES_IN);
    const newRefreshToken = signJwt({ sub: user.id, type: 'refresh' }, JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN);

    user.refreshToken = newRefreshToken;
    await this.userRepo.save(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
