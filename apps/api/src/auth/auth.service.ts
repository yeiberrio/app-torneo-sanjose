import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('El correo electronico ya esta registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = uuidv4();
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const requestedRole = dto.requestedRole || Role.CITIZEN;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        gender: dto.gender,
        emailVerifyToken,
        emailVerifyExpires,
        role: Role.CITIZEN,
        status: UserStatus.PENDING_EMAIL,
        // Step 2 fields (optional for CITIZEN)
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        municipalityId: dto.municipalityId,
        sectorId: dto.sectorId,
        address: dto.address,
        roleJustification: dto.roleJustification,
      },
    });

    // Create role request if requesting a role above CITIZEN
    if (requestedRole !== Role.CITIZEN) {
      await this.prisma.roleRequest.create({
        data: {
          userId: user.id,
          requestedRole,
          justification: dto.roleJustification,
        },
      });
    }

    // TODO: Send verification email

    return {
      message: 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.',
      userId: user.id,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token invalido o expirado');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
        status: UserStatus.ACTIVE,
      },
    });

    return { message: 'Email verificado exitosamente. Ya puedes iniciar sesion.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Tu cuenta ha sido baneada');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Tu cuenta esta suspendida');
    }

    // For dev: allow login even without email verification
    // In production, uncomment this:
    // if (!user.emailVerified) {
    //   throw new UnauthorizedException('Debes verificar tu email antes de iniciar sesion');
    // }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const tokens = await this.generateTokens(session.user.id, session.user.email, session.user.role);

    // Rotate refresh token
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({ where: { refreshToken } });
    return { message: 'Sesion cerrada exitosamente' };
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    return { accessToken, refreshToken };
  }
}
