import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@Controller('api/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  async create(@Body() createAuditDto: CreateAuditDto, @Request() req: any) {
    return await this.auditService.create({
      ...createAuditDto,
      userId: req.user.id,
    });
  }

  @Get('logs')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('accion') accion?: string,
    @Query('tabla') tabla?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      return await this.auditService.findAll(
        page,
        limit,
        accion,
        tabla,
        userId,
        parsedStartDate,
        parsedEndDate,
      );
    } catch (error) {
      console.error('Error in findAll audit logs:', error);
      throw error;
    }
  }

  @Get('stats')
  async getStats() {
    try {
      return await this.auditService.getAuditStats();
    } catch (error) {
      console.error('Error getting audit stats:', error);
      throw error;
    }
  }

  @Get('users/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    try {
      return await this.auditService.findByUser(userId, page, limit);
    } catch (error) {
      console.error('Error finding audit logs by user:', error);
      throw error;
    }
  }

  @Get('entities/:entityType')
  async findByEntityType(
    @Param('entityType') entityType: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    try {
      return await this.auditService.findByEntityType(entityType, page, limit);
    } catch (error) {
      console.error('Error finding audit logs by entity type:', error);
      throw error;
    }
  }

  @Get('logs/:id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.auditService.findOne(id);
    } catch (error) {
      console.error('Error finding audit log by id:', error);
      throw error;
    }
  }
}