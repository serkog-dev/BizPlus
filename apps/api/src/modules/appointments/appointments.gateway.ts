import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@WebSocketGateway({
  cors: {
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3002',
    ],
    credentials: true,
  },
  namespace: '/ws',
})
export class AppointmentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(AppointmentsGateway.name)

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1]
      if (!token) {
        client.disconnect()
        return
      }

      const payload = this.jwt.verify(token)
      client.data.tenantId = payload.tenantId
      client.data.userId = payload.sub
      client.data.isAdmin = payload.isAdmin

      if (payload.isAdmin) {
        // Admin joins all-tenants room
        await client.join('admin:all')
        this.logger.log(`Admin connected: ${payload.sub}`)
      } else {
        // Business user joins their tenant room
        await client.join(`tenant:${payload.tenantId}`)
        this.logger.log(`User connected to tenant:${payload.tenantId}`)
      }
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  /** Emit event to all clients in a tenant room */
  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data)
    // Also notify admin
    this.server.to('admin:all').emit(event, { tenantId, ...data })
  }

  /** Public booking page joins by tenant slug */
  @SubscribeMessage('join:public')
  async handleJoinPublic(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantSlug: string },
  ) {
    await client.join(`public:${data.tenantSlug}`)
  }

  /** Emit to public booking page when availability changes */
  emitAvailabilityChange(tenantSlug: string, data: any) {
    this.server.to(`public:${tenantSlug}`).emit('availability:changed', data)
  }
}
