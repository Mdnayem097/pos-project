import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.repo.findOneBy({ name: dto.name });
    if (exists) throw new ConflictException('This category already exists');
    return this.repo.save(this.repo.create(dto));
  }
}
