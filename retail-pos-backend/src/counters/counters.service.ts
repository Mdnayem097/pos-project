import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Sale } from '../sales/sale.entity';
import { CounterSession } from './counter-session.entity';
import { Counter } from './counter.entity';
import { CloseCounterDto } from './dto/close-counter.dto';
import { CreateCounterDto } from './dto/create-counter.dto';
import { OpenCounterDto } from './dto/open-counter.dto';
import { UpdateCounterDto } from './dto/update-counter.dto';

@Injectable()
export class CountersService implements OnModuleInit {
  constructor(
    @InjectRepository(Counter)
    private readonly counterRepo: Repository<Counter>,
    @InjectRepository(CounterSession)
    private readonly sessionRepo: Repository<CounterSession>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
  ) {}

  async onModuleInit() {
    const count = await this.counterRepo.count();
    if (count === 0) {
      await this.counterRepo.save(
        this.counterRepo.create({
          name: 'Counter 1',
          isActive: true,
        }),
      );
    }
  }

  async findAll() {
    const counters = await this.counterRepo.find({
      order: { id: 'ASC' },
      relations: { sessions: true },
    });

    return counters.map((c) => {
      const activeSession = c.sessions?.find((s) => s.status === 'Open');
      return {
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        isOpen: !!activeSession,
        currentSession: activeSession || null,
        totalSessions: c.sessions ? c.sessions.length : 0,
      };
    });
  }

  async findOne(id: number) {
    const counter = await this.counterRepo.findOne({
      where: { id },
      relations: { sessions: true },
    });
    if (!counter) throw new NotFoundException(`Counter #${id} not found`);

    const activeSession = counter.sessions?.find((s) => s.status === 'Open');
    return {
      ...counter,
      isOpen: !!activeSession,
      currentSession: activeSession || null,
      totalSessions: counter.sessions ? counter.sessions.length : 0,
    };
  }

  async create(dto: CreateCounterDto) {
    const counter = this.counterRepo.create({
      name: dto.name.trim(),
      isActive: true,
    });
    return this.counterRepo.save(counter);
  }

  async update(id: number, dto: UpdateCounterDto) {
    const counter = await this.counterRepo.findOneBy({ id });
    if (!counter) throw new NotFoundException(`Counter #${id} not found`);

    if (dto.name !== undefined) counter.name = dto.name.trim();
    if (dto.isActive !== undefined) counter.isActive = dto.isActive;

    return this.counterRepo.save(counter);
  }

  async remove(id: number) {
    const counter = await this.counterRepo.findOne({
      where: { id },
      relations: { sessions: true },
    });
    if (!counter) throw new NotFoundException(`Counter #${id} not found`);

    const sessionCount = counter.sessions ? counter.sessions.length : 0;
    if (sessionCount > 0) {
      // If sessions exist, soft-delete by deactivating
      counter.isActive = false;
      await this.counterRepo.save(counter);
      return {
        id,
        deactivated: true,
        message: 'Counter has past sessions, so it was marked inactive instead of deleted.',
      };
    }

    await this.counterRepo.remove(counter);
    return { id, deleted: true, message: 'Counter deleted successfully.' };
  }

  async getCurrentSession() {
    const session = await this.sessionRepo.findOne({
      where: { status: 'Open' },
      relations: { counter: true },
      order: { openedAt: 'DESC' },
    });

    if (!session) {
      return { session: null, isOpen: false };
    }

    // Calculate live sales during this shift
    const sales = await this.saleRepo.find({
      where: {
        createdAt: MoreThanOrEqual(session.openedAt),
      },
    });

    const nonCancelled = sales.filter((s) => s.status !== 'Cancelled');
    const cashSales = nonCancelled
      .filter((s) => s.payment === 'Cash')
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalSales = nonCancelled.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    return {
      session,
      isOpen: true,
      currentCashSales: Math.round(cashSales * 100) / 100,
      currentTotalSales: Math.round(totalSales * 100) / 100,
      totalOrders: nonCancelled.length,
      expectedCash: Math.round((Number(session.openingCash) + cashSales) * 100) / 100,
    };
  }

  async openSession(counterId: number, dto: OpenCounterDto) {
    const counter = await this.counterRepo.findOneBy({ id: counterId });
    if (!counter) throw new NotFoundException(`Counter #${counterId} not found`);
    if (!counter.isActive) {
      throw new BadRequestException(`Counter #${counterId} is inactive. Please activate it first.`);
    }

    const existingOpen = await this.sessionRepo.findOneBy({
      counterId,
      status: 'Open',
    });
    if (existingOpen) {
      throw new BadRequestException(
        `Counter "${counter.name}" already has an active open session. Please close it first.`,
      );
    }

    const session = this.sessionRepo.create({
      counterId,
      openingCash: dto.openingCash,
      cashierName: dto.cashierName || 'Demo Admin',
      status: 'Open',
      openedAt: new Date(),
    });

    return this.sessionRepo.save(session);
  }

  async closeSession(counterId: number, dto: CloseCounterDto) {
    const session = await this.sessionRepo.findOne({
      where: { counterId, status: 'Open' },
      relations: { counter: true },
    });

    if (!session) {
      throw new NotFoundException(`No open session found for Counter #${counterId}`);
    }

    const closedAt = new Date();

    // Query all sales during the session window
    const sales = await this.saleRepo.find({
      where: {
        createdAt: Between(session.openedAt, closedAt),
      },
    });

    const validSales = sales.filter((s) => s.status !== 'Cancelled');
    const cashSales = validSales
      .filter((s) => s.payment === 'Cash')
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalSales = validSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalOrders = validSales.length;

    const openingCash = Number(session.openingCash) || 0;
    const closingCash = Number(dto.closingCash) || 0;
    const expectedCash = Math.round((openingCash + cashSales) * 100) / 100;
    const difference = Math.round((closingCash - expectedCash) * 100) / 100;

    session.closingCash = closingCash;
    session.closedAt = closedAt;
    session.expectedCash = expectedCash;
    session.difference = difference;
    session.totalSales = Math.round(totalSales * 100) / 100;
    session.totalOrders = totalOrders;
    session.note = dto.note || null;
    session.status = 'Closed';

    const saved = await this.sessionRepo.save(session);

    return {
      session: saved,
      counter: session.counter,
      openingCash,
      closingCash,
      cashSales: Math.round(cashSales * 100) / 100,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      expectedCash,
      difference,
      isBalanced: difference === 0,
      isOver: difference > 0,
      isShort: difference < 0,
    };
  }

  async getSessions(counterId: number) {
    const counter = await this.counterRepo.findOneBy({ id: counterId });
    if (!counter) throw new NotFoundException(`Counter #${counterId} not found`);

    return this.sessionRepo.find({
      where: { counterId },
      order: { openedAt: 'DESC' },
    });
  }
}
