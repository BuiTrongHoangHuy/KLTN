import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}
  async create(createReportDto: CreateReportDto, reporterId: number) {
    const { postId, commentId, reason } = createReportDto;

    if (postId && commentId) {
      throw new BadRequestException(
        'You can only report a post or a comment, not both',
      );
    }

    try {
      const existingReport = await this.reportsRepository.findOneBy({
        reporterId,
        postId: postId,
        commentId: commentId,
      });

      if (existingReport) {
        throw new ConflictException('Report already exists');
      }

      const newReport = this.reportsRepository.create({
        reporterId,
        postId: postId,
        commentId: commentId,
        reason,
        status: 'pending',
      });

      await this.reportsRepository.save(newReport);
      return { message: 'Successfully created report' };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating report');
    }
  }

  findAll() {
    return `This action returns all reports`;
  }

  findOne(id: number) {
    return `This action returns a #${id} report`;
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }

  remove(id: number) {
    return `This action removes a #${id} report`;
  }
}
