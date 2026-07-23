import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
  ) {}

  async findAll(includeInactive = false) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.sortOrder', 'ASC');
    if (!includeInactive) qb.where('c.isActive = true');
    return qb.getMany();
  }

  async findOne(id: string) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-');
    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Slug already exists');
    const cat = this.repo.create({ ...dto, slug });
    return this.repo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.findOne(id);
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string) {
    const cat = await this.findOne(id);
    await this.repo.remove(cat);
    return { message: 'Category deleted' };
  }
}
