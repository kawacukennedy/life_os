import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Connection, ConnectionStatus, ConnectionType } from "./connection.entity";
import { CreateConnectionDto } from "./dto/create-connection.dto";
import { UpdateConnectionDto } from "./dto/update-connection.dto";

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private connectionsRepository: Repository<Connection>,
  ) {}

  async create(createConnectionDto: CreateConnectionDto, requesterId: string): Promise<Connection> {
    // Check if connection already exists
    const existingConnection = await this.connectionsRepository.findOne({
      where: [
        { requesterId, addresseeId: createConnectionDto.addresseeId },
        { requesterId: createConnectionDto.addresseeId, addresseeId: requesterId },
      ],
    });

    if (existingConnection) {
      throw new BadRequestException('Connection already exists between these users');
    }

    // Prevent self-connections
    if (requesterId === createConnectionDto.addresseeId) {
      throw new BadRequestException('Cannot connect to yourself');
    }

    const connection = this.connectionsRepository.create({
      ...createConnectionDto,
      requesterId,
    });

    return this.connectionsRepository.save(connection);
  }

  async findAll(userId: string, options?: {
    status?: ConnectionStatus;
    type?: ConnectionType;
    limit?: number;
    offset?: number;
  }): Promise<Connection[]> {
    const query = this.connectionsRepository
      .createQueryBuilder('connection')
      .where('connection.requesterId = :userId OR connection.addresseeId = :userId', { userId });

    if (options?.status) {
      query.andWhere('connection.status = :status', { status: options.status });
    }

    if (options?.type) {
      query.andWhere('connection.type = :type', { type: options.type });
    }

    query.orderBy('connection.updatedAt', 'DESC');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({
      where: { id },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Check if user is part of this connection
    if (connection.requesterId !== userId && connection.addresseeId !== userId) {
      throw new BadRequestException('You are not part of this connection');
    }

    return connection;
  }

  async update(id: string, updateConnectionDto: UpdateConnectionDto, userId: string): Promise<Connection> {
    const connection = await this.findOne(id, userId);

    // Only the addressee can accept/reject pending connections
    if (connection.status === ConnectionStatus.PENDING) {
      if (userId !== connection.addresseeId) {
        throw new BadRequestException('Only the recipient can respond to connection requests');
      }

      if (updateConnectionDto.status === ConnectionStatus.ACCEPTED) {
        updateConnectionDto.acceptedAt = new Date();
        updateConnectionDto.isMutual = true;
      } else if (updateConnectionDto.status === ConnectionStatus.BLOCKED) {
        updateConnectionDto.blockedAt = new Date();
      }
    }

    // Either party can update type or block after acceptance
    if (connection.status === ConnectionStatus.ACCEPTED) {
      if (updateConnectionDto.status === ConnectionStatus.BLOCKED) {
        updateConnectionDto.blockedAt = new Date();
      }
    }

    Object.assign(connection, updateConnectionDto);
    return this.connectionsRepository.save(connection);
  }

  async remove(id: string, userId: string): Promise<void> {
    const connection = await this.findOne(id, userId);
    await this.connectionsRepository.remove(connection);
  }

  async getConnectionBetweenUsers(userId1: string, userId2: string): Promise<Connection | null> {
    return this.connectionsRepository.findOne({
      where: [
        { requesterId: userId1, addresseeId: userId2 },
        { requesterId: userId2, addresseeId: userId1 },
      ],
    });
  }

  async getPendingRequests(userId: string): Promise<Connection[]> {
    return this.connectionsRepository.find({
      where: {
        addresseeId: userId,
        status: ConnectionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getAcceptedConnections(userId: string): Promise<Connection[]> {
    return this.connectionsRepository
      .createQueryBuilder('connection')
      .where('(connection.requesterId = :userId OR connection.addresseeId = :userId)', { userId })
      .andWhere('connection.status = :status', { status: ConnectionStatus.ACCEPTED })
      .orderBy('connection.updatedAt', 'DESC')
      .getMany();
  }

  async getConnectionStats(userId: string): Promise<{
    totalConnections: number;
    pendingRequests: number;
    sentRequests: number;
    connectionsByType: Record<ConnectionType, number>;
  }> {
    const [totalConnections, pendingRequests, sentRequests] = await Promise.all([
      this.connectionsRepository.count({
        where: [
          { requesterId: userId, status: ConnectionStatus.ACCEPTED },
          { addresseeId: userId, status: ConnectionStatus.ACCEPTED },
        ],
      }),
      this.connectionsRepository.count({
        where: { addresseeId: userId, status: ConnectionStatus.PENDING },
      }),
      this.connectionsRepository.count({
        where: { requesterId: userId, status: ConnectionStatus.PENDING },
      }),
    ]);

    // Count by type
    const connections = await this.getAcceptedConnections(userId);
    const connectionsByType = connections.reduce((acc, conn) => {
      acc[conn.type] = (acc[conn.type] || 0) + 1;
      return acc;
    }, {} as Record<ConnectionType, number>);

    return {
      totalConnections,
      pendingRequests,
      sentRequests,
      connectionsByType,
    };
  }

  async blockUser(blockerId: string, blockedUserId: string): Promise<Connection> {
    let connection = await this.getConnectionBetweenUsers(blockerId, blockedUserId);

    if (!connection) {
      // Create a blocked connection
      connection = this.connectionsRepository.create({
        requesterId: blockerId,
        addresseeId: blockedUserId,
        status: ConnectionStatus.BLOCKED,
        blockedAt: new Date(),
      });
    } else {
      connection.status = ConnectionStatus.BLOCKED;
      connection.blockedAt = new Date();
    }

    return this.connectionsRepository.save(connection);
  }

  async unblockUser(unblockerId: string, unblockedUserId: string): Promise<void> {
    const connection = await this.getConnectionBetweenUsers(unblockerId, unblockedUserId);

    if (connection && connection.status === ConnectionStatus.BLOCKED) {
      await this.connectionsRepository.remove(connection);
    }
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.getConnectionBetweenUsers(userId1, userId2);
    return connection?.status === ConnectionStatus.BLOCKED || false;
  }
}