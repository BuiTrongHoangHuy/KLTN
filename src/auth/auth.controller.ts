import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RtGuard } from './guards/rt.guard';
import { GetUser } from './decorators/get-user.decorator';

type JwtPayload = {
  sub: number;
  username: string;
  role: string;
};
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(RtGuard)
  refreshToken(@GetUser() user: JwtPayload) {
    return this.authService.refreshToken(user.sub);
  }
}
