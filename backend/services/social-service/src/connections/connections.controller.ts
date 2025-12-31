import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { Connection, ConnectionStatus, ConnectionType } from './connection.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a connection request' })
  @ApiResponse({ status: 201, description: 'Connection request sent successfully', type: Connection })
  create(@Body() createConnectionDto: CreateConnectionDto, @Request() req) {
    return this.connectionsService.create(createConnectionDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user connections' })
  @ApiResponse({ status: 200, description: 'Connections retrieved successfully', type: [Connection] })
  findAll(
    @Request() req,
    @Query('status') status?: ConnectionStatus,
    @Query('type') type?: ConnectionType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options: any = {};
    if (status) options.status = status;
    if (type) options.type = type;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    return this.connectionsService.findAll(req.user.userId, options);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending connection requests' })
  @ApiResponse({ status: 200, description: 'Pending requests retrieved successfully', type: [Connection] })
  getPendingRequests(@Request() req) {
    return this.connectionsService.getPendingRequests(req.user.userId);
  }

  @Get('accepted')
  @ApiOperation({ summary: 'Get accepted connections' })
  @ApiResponse({ status: 200, description: 'Accepted connections retrieved successfully', type: [Connection] })
  getAcceptedConnections(@Request() req) {
    return this.connectionsService.getAcceptedConnections(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get connection statistics' })
  @ApiResponse({ status: 200, description: 'Connection stats retrieved successfully' })
  getConnectionStats(@Request() req) {
    return this.connectionsService.getConnectionStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific connection' })
  @ApiResponse({ status: 200, description: 'Connection retrieved successfully', type: Connection })
  findOne(@Param('id') id: string, @Request() req) {
    return this.connectionsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a connection' })
  @ApiResponse({ status: 200, description: 'Connection updated successfully', type: Connection })
  update(@Param('id') id: string, @Body() updateConnectionDto: UpdateConnectionDto, @Request() req) {
    return this.connectionsService.update(id, updateConnectionDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a connection' })
  @ApiResponse({ status: 200, description: 'Connection removed successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.connectionsService.remove(id, req.user.userId);
  }

  @Post(':userId/block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  blockUser(@Param('userId') userId: string, @Request() req) {
    return this.connectionsService.blockUser(req.user.userId, userId);
  }

  @Post(':userId/unblock')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  unblockUser(@Param('userId') userId: string, @Request() req) {
    return this.connectionsService.unblockUser(req.user.userId, userId);
  }

  @Get(':userId/status')
  @ApiOperation({ summary: 'Check connection status with another user' })
  @ApiResponse({ status: 200, description: 'Connection status retrieved successfully' })
  async getConnectionStatus(@Param('userId') otherUserId: string, @Request() req) {
    const connection = await this.connectionsService.getConnectionBetweenUsers(req.user.userId, otherUserId);
    const isBlocked = await this.connectionsService.isBlocked(req.user.userId, otherUserId);

    return {
      connection: connection || null,
      isBlocked,
    };
  }
}