import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import * as bcrypt from 'bcrypt'
import { RegisterDto, LoginDto } from '@bizplus/shared'
import { generateSlug } from '@bizplus/shared'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ===== BUSINESS REGISTRATION =====
  async register(dto: RegisterDto) {
    // Check if email already exists globally
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    })
    if (existingUser) {
      throw new ConflictException('כתובת אימייל זו כבר רשומה במערכת')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const slug = await this.generateUniqueSlug(dto.businessName)

    // Create tenant + owner user + subscription + default location in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.businessName,
          slug,
          email: dto.businessEmail,
          phone: dto.businessPhone,
          settings: {
            appointmentBuffer: 0,
            minBookAhead: 1,
            maxBookAhead: 60,
            cancellationDeadline: 24,
            requireConfirmation: false,
            sendReminders: true,
            reminder24h: true,
            reminder1h: true,
            defaultDuration: 30,
            messageLanguage: 'he',
            messageSignature: '',
          },
        },
      })

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'OWNER',
        },
      })

      // Create default location
      await tx.location.create({
        data: {
          tenantId: tenant.id,
          name: dto.businessName,
          address: 'עדכן כתובת',
          phone: dto.businessPhone,
          isDefault: true,
        },
      })

      // Create trial subscription (14 days)
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      const periodEnd = new Date(trialEnd)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'BASIC',
          status: 'TRIAL',
          trialEndsAt: trialEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          monthlyPrice: 99,
        },
      })

      return { tenant, user }
    })

    const tokens = await this.generateTokens(result.user.id, result.tenant.id, result.user.role)

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        tenantId: result.tenant.id,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
      },
      ...tokens,
    }
  }

  // ===== BUSINESS LOGIN =====
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { tenant: true },
    })

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('אימייל או סיסמה שגויים')
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const tokens = await this.generateTokens(user.id, user.tenantId, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        logoUrl: user.tenant.logoUrl,
        brandColors: user.tenant.brandColors,
        onboardingCompleted: user.tenant.onboardingCompleted,
      },
      ...tokens,
    }
  }

  // ===== ADMIN LOGIN =====
  async adminLogin(dto: LoginDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    })

    if (!admin || !admin.isActive || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('אימייל או סיסמה שגויים')
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    const accessToken = this.jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role, isAdmin: true, tenantId: null },
      { expiresIn: '15m' },
    )

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
      accessToken,
    }
  }

  // ===== REFRESH TOKEN =====
  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { token } })
      }
      throw new UnauthorizedException('פגישת העבודה פגה. אנא התחבר מחדש')
    }

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { token } })
    const tokens = await this.generateTokens(stored.userId, stored.user.tenantId, stored.user.role)
    return tokens
  }

  // ===== LOGOUT =====
  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }
  }

  // ===== HELPERS =====
  private async generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role, email: '' }

    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' })

    const refreshTokenValue = require('crypto').randomBytes(64).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt,
      },
    })

    return { accessToken, refreshToken: refreshTokenValue }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = generateSlug(name)
    let counter = 0
    while (true) {
      const candidate = counter > 0 ? `${slug}-${counter}` : slug
      const existing = await this.prisma.tenant.findUnique({ where: { slug: candidate } })
      if (!existing) return candidate
      counter++
    }
  }
}
