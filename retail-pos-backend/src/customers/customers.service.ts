import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { Sale } from '../sales/sale.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
  ) {}

  async findAll(q?: string) {
    let customers: Customer[];
    if (!q) {
      customers = await this.repo.find({ order: { name: 'ASC' } });
    } else {
      customers = await this.repo.find({
        where: [{ name: Like(`%${q}%`) }, { phone: Like(`%${q}%`) }],
        order: { name: 'ASC' },
      });
    }

    const sales = await this.salesRepo.find({
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });

    return customers.map((c) => {
      const custSales = sales.filter((s) => s.customer?.id === c.id);
      const totalOrders = custSales.length;
      const totalSpent = custSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      const lastVisitDate = custSales[0]?.createdAt || c.createdAt;
      const lastVisit = lastVisitDate
        ? new Date(lastVisitDate).toISOString().split('T')[0]
        : 'N/A';

      return {
        ...c,
        totalOrders,
        totalSpent,
        lastVisit,
      };
    });
  }

  async findOne(id: number) {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer ${id} was not found`);
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const exists = await this.repo.findOneBy({ phone: dto.phone });
    if (exists) {
      throw new ConflictException('A customer with this phone number already exists');
    }
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: number) {
    const customer = await this.findOne(id);
    await this.repo.remove(customer);
    return { deleted: true };
  }
}
