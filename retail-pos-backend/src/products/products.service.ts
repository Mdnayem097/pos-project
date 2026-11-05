import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
  ) {}

  findAll(q?: string, category?: string) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .orderBy('p.name', 'ASC');
    if (q) qb.andWhere('(p.name LIKE :q OR p.sku LIKE :q)', { q: `%${q}%` });
    if (category) qb.andWhere('c.name = :category', { category });
    return qb.getMany();
  }

  async findOne(id: number) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} was not found`);
    return product;
  }

  async create(dto: CreateProductDto) {
    const { categoryId, ...rest } = dto;
    const category = await this.categories.findOneBy({ id: categoryId });
    if (!category) throw new BadRequestException(`Category ${categoryId} was not found`);
    const exists = await this.repo.findOneBy({ sku: dto.sku });
    if (exists) throw new ConflictException(`SKU ${dto.sku} is already used`);
    return this.repo.save(this.repo.create({ ...rest, category }));
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const { categoryId, ...rest } = dto;
    if (categoryId !== undefined) {
      const category = await this.categories.findOneBy({ id: categoryId });
      if (!category) throw new BadRequestException(`Category ${categoryId} was not found`);
      product.category = category;
    }
    Object.assign(product, rest);
    return this.repo.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.repo.remove(product);
    return { deleted: true };
  }
}
