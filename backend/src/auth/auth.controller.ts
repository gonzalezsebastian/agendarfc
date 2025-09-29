import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { SupabaseUserGuard } from './supabase-user.guard';
import { SignupDto } from 'src/common/dto/SignUpDto';
import { LoginDto } from 'src/common/dto/LoginDto';
import { RefreshTokenDto } from 'src/common/dto/RefreshTokenDto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(SupabaseUserGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @UseGuards(SupabaseUserGuard)
  async getCurrentUser(@Request() req: any) {
    return this.authService.getCurrentUserProfile(req.user.id);
  }

  @Get('profile')
  @UseGuards(SupabaseUserGuard)
  async getUserProfile(@Request() req: any) {
    return this.authService.getUserProfile(req.user.id);
  }
}