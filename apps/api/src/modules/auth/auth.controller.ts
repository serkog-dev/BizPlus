import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { RegisterSchema, LoginSchema } from '@bizplus/shared'
import { Public, CurrentUser } from '../../common/decorators'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'הרשמת עסק חדש ל-BizPlus' })
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = RegisterSchema.parse(body)
    const result = await this.authService.register(dto)
    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    return {
      success: true,
      data: {
        user: result.user,
        tenant: result.tenant,
        accessToken: result.accessToken,
      },
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'כניסה לדשבורד בעל העסק' })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = LoginSchema.parse(body)
    const result = await this.authService.login(dto)
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return {
      success: true,
      data: {
        user: result.user,
        tenant: result.tenant,
        accessToken: result.accessToken,
      },
    }
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'כניסה לפאנל Super Admin' })
  async adminLogin(@Body() body: unknown) {
    const dto = LoginSchema.parse(body)
    const result = await this.authService.adminLogin(dto)
    return { success: true, data: result }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'חידוש Access Token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token
    if (!token) {
      return { success: false, error: 'אין טוקן חידוש' }
    }
    const result = await this.authService.refreshToken(token)
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return { success: true, data: { accessToken: result.accessToken } }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'יציאה מהמערכת' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token
    await this.authService.logout(token)
    res.clearCookie('refresh_token')
    return { success: true, message: 'יצאת מהמערכת בהצלחה' }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'פרטי המשתמש המחובר' })
  async me(@CurrentUser() user: any) {
    return { success: true, data: user }
  }
}
