import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../auth/auth.crypto';
import { User } from '../auth/user.entity';
import { Role } from '../roles/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(): Promise<Omit<User, 'password' | 'refreshToken'>[]> {
    const users = await this.userRepo.find({
      relations: { roleEntity: true },
      order: { isSuperAdmin: 'DESC', createdAt: 'DESC' },
    });

    return users.map((u) => {
      const { password, refreshToken, ...rest } = u;
      return rest;
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { roleEntity: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} does not exist`);
    }

    const user = this.userRepo.create({
      name: dto.name.trim(),
      email,
      password: hashPassword(dto.password),
      roleId: role.id,
      roleEntity: role,
      role: role.slug,
      isActive: true,
      isSuperAdmin: false,
      mustChangePassword: true, // First login requires password change!
    });

    const saved = await this.userRepo.save(user);
    const { password, refreshToken, ...rest } = saved;
    return rest;
  }

  async update(id: number, dto: UpdateUserDto): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.findById(id);

    if (user.isSuperAdmin) {
      if (dto.isActive === false) {
        throw new BadRequestException('Super Admin cannot be deactivated');
      }
      if (dto.roleId && dto.roleId !== user.roleId) {
        throw new BadRequestException('Super Admin role cannot be changed');
      }
    }

    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.userRepo.findOne({ where: { email } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`User with email '${dto.email}' already exists`);
      }
      user.email = email;
    }

    if (dto.name) {
      user.name = dto.name.trim();
    }

    if (dto.roleId) {
      const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (!role) {
        throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
      }
      user.roleId = role.id;
      user.roleEntity = role;
      user.role = role.slug;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    if (dto.password) {
      user.password = hashPassword(dto.password);
      if (dto.mustChangePassword !== undefined) {
        user.mustChangePassword = dto.mustChangePassword;
      }
    } else if (dto.mustChangePassword !== undefined) {
      user.mustChangePassword = dto.mustChangePassword;
    }

    const saved = await this.userRepo.save(user);
    const { password, refreshToken, ...rest } = saved;
    return rest;
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);

    if (user.isSuperAdmin) {
      throw new BadRequestException('Super Admin account cannot be deleted');
    }

    await this.userRepo.remove(user);
    return { success: true, message: `User '${user.name}' has been deleted` };
  }
}
