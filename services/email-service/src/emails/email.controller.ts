import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { Email } from './email.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('sync')
  syncEmails(
    @Body() body: { userId: string; accessToken: string },
  ): Promise<Email[]> {
    return this.emailService.syncEmails(body.userId, body.accessToken);
  }

  @Get()
  getEmails(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('isRead') isRead?: boolean,
  ): Promise<Email[]> {
    return this.emailService.getEmails(userId, {
      limit: limit ? +limit : undefined,
      offset: offset ? +offset : undefined,
      isRead: isRead ? isRead === 'true' : undefined,
    });
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string): Promise<Email> {
    return this.emailService.markAsRead(id);
  }

  @Patch(':id/archive')
  archiveEmail(@Param('id') id: string): Promise<Email> {
    return this.emailService.archiveEmail(id);
  }

  @Post(':id/summary')
  generateSummary(
    @Param('id') id: string,
    @Body() body: { accessToken: string },
  ): Promise<string> {
    return this.emailService.generateSummary(id, body.accessToken);
  }

  @Get(':id/actions')
  suggestActions(@Param('id') id: string): Promise<any[]> {
    return this.emailService.suggestActions(id);
  }
}