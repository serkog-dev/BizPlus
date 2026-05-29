import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /** Soft-delete helper - adds tenantId to every query via middleware */
  async enableTenantFilter(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Auto-inject tenantId for tenant-scoped models
            const tenantModels = [
              'Location', 'User', 'Service', 'Provider', 'Customer',
              'Appointment', 'Conversation', 'ChannelConfig', 'AuditLog',
            ]
            if (tenantModels.includes(model)) {
              if (operation === 'findMany' || operation === 'findFirst' || operation === 'count') {
                args.where = { ...args.where, tenantId }
              }
              if (operation === 'create') {
                args.data = { ...(args.data as object), tenantId } as typeof args.data
              }
            }
            return query(args)
          },
        },
      },
    })
  }
}
