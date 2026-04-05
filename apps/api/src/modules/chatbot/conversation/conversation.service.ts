import { Injectable, Logger } from '@nestjs/common'
import { InjectRedis } from '@nestjs-modules/ioredis'
import Redis from 'ioredis'
import { ConversationContext, ConversationStep } from './conversation-state'

const TTL_SECONDS = 60 * 30 // 30 דקות של חוסר פעילות → מאפסים

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name)

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private key(tenantSlug: string, phone: string): string {
    return `chatbot:conv:${tenantSlug}:${phone}`
  }

  async get(tenantSlug: string, phone: string): Promise<ConversationContext | null> {
    const raw = await this.redis.get(this.key(tenantSlug, phone))
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  async set(ctx: ConversationContext): Promise<void> {
    const key = this.key(ctx.tenantSlug, ctx.phone)
    await this.redis.setex(key, TTL_SECONDS, JSON.stringify(ctx))
  }

  async clear(tenantSlug: string, phone: string): Promise<void> {
    await this.redis.del(this.key(tenantSlug, phone))
  }

  // מחזיר קונטקסט קיים או יוצר חדש
  async getOrCreate(tenantSlug: string, phone: string): Promise<ConversationContext> {
    const existing = await this.get(tenantSlug, phone)
    if (existing) return existing
    return {
      tenantSlug,
      phone,
      step: ConversationStep.IDLE,
    }
  }
}
