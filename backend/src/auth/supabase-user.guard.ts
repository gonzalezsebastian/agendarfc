import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class SupabaseUserGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers?.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('Missing bearer token');

    // Valida el token pidiendo el usuario a Supabase
    const { data: { user }, error } = await this.supabaseService.getClient().auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Invalid token');

    req.user = user; // <- tendrás user.id, email, app_metadata, etc.
    return true;
  }
}