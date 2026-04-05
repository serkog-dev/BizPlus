import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../database/prisma.service'

export interface JwtPayload {
  sub: string        // userId
  tenantId: string
  role: string
  email: string
  isAdmin?: boolean  // true for admin users
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_PUBLIC_KEY')?.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
    })
  }

  async validate(payload: JwtPayload) {
    // Admin users have isAdmin flag
    if (payload.isAdmin) {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      })
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('החשבון אינו פעיל')
      }
      return { ...admin, isAdmin: true }
    }

    // Business users
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('החשבון אינו פעיל')
    }

    return user
  }
}
