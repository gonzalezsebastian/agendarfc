import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { SignupDto } from 'src/common/dto/SignUpDto';
import { LoginDto } from 'src/common/dto/LoginDto';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private adminClient: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    this.adminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async signup(signupDto: SignupDto) {
    const { email, password, username, phone = '', role = 'user' } = signupDto;

    try {
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            data: { username, phone, role }
          }
        });

      if (authError) throw new BadRequestException(authError.message);
      if (!authData.user) throw new BadRequestException('Failed to create user');

      return {
        user: authData.user,
        session: authData.session,
        message: authData.session 
          ? 'Account created successfully' 
          : 'Please confirm your email to complete registration'
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('Login failed');
      }

      const profile = await this.getUserProfile(data.user.id);

      return {
        user: data.user,
        profile,
        session: data.session,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (error) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        session: data.session,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Token refresh failed');
    }
  }

  async logout(userId: string) {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .auth.signOut();

      if (error) {
        throw new InternalServerErrorException('Logout failed');
      }

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async getCurrentUserProfile(userId: string) {
    try {
      // Get Supabase auth user
      const { data: userData, error: userError } = await this.supabaseService
        .getClient()
        .auth.getUser();

      if (userError || !userData.user) {
        throw new UnauthorizedException('User not found');
      }

      // Get profile from database
      const profile = await this.getUserProfile(userId);

      return {
        user: userData.user,
        profile,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get user profile');
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data: profile, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new BadRequestException('User profile not found');
        }
        throw new InternalServerErrorException('Failed to fetch user profile');
      }

      return profile;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }

  async updateUserProfile(userId: string, updates: Partial<{ username: string; phone: string }>) {
    try {
      const { data: profile, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException('Failed to update profile');
      }

      return profile;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update profile');
    }
  }
}