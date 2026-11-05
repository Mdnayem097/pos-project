import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SYSTEM_MODULES } from '../auth/auth.constants';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      order: { isSystem: 'DESC', name: 'ASC' },
    });
  }

  async findById(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findBySlug(slug: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { slug } });
  }

  getAvailableModules() {
    return SYSTEM_MODULES;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const slug =
      dto.slug?.toLowerCase().trim().replace(/\s+/g, '_') ||
      dto.name.toLowerCase().trim().replace(/\s+/g, '_');

    const existing = await this.roleRepo.findOne({
      where: [{ name: dto.name.trim() }, { slug }],
    });
    if (existing) {
      throw new ConflictException(`Role with name '${dto.name}' already exists`);
    }

    const role = this.roleRepo.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || null,
      permissions: Array.from(new Set(dto.permissions || [])),
      isSystem: false,
    });

    return this.roleRepo.save(role);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);

    if (role.slug === 'super_admin') {
      throw new BadRequestException('Super Admin system role permissions cannot be altered');
    }

    if (dto.name && dto.name.trim() !== role.name) {
      if (role.isSystem) {
        throw new BadRequestException('System role names cannot be modified');
      }
      const existing = await this.roleRepo.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`A role with name '${dto.name}' already exists`);
      }
      role.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      role.description = dto.description?.trim() || null;
    }

    if (dto.permissions !== undefined) {
      role.permissions = Array.from(new Set(dto.permissions));
    }

    return this.roleRepo.save(role);
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new BadRequestException('System-defined roles cannot be deleted');
    }

    await this.roleRepo.remove(role);
    return { success: true, message: `Role '${role.name}' deleted successfully` };
  }
}
