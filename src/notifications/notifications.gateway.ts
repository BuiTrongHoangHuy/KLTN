import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private jwtService: JwtService;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.jwtService = new JwtService({
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) {
        throw new Error('Token not found');
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      await client.join(`user_${userId}`);
      this.logger.log(`Client ${client.id} (User ${userId}) error connected`);
    } catch (e) {
      this.logger.error(`Connect failed: ${e.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  emitNotificationToUser(userId: number, notificationData: any) {
    const userRoom = `user_${userId}`;
    this.server.to(userRoom).emit('new_notification', notificationData);
  }
}
