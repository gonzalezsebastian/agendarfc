export class SignupDto {
  email: string;
  password: string;
  username: string;
  phone?: string;
  role?: 'user' | 'player' | 'admin';
}