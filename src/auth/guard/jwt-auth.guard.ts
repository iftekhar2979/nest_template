import { AuthService } from './../auth.service';
// import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import * as passport from 'passport';
// import { AuthService } from '../auth/auth.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload; // Attach user data to req.user
      return true;
    } catch (error) {
        throw new UnauthorizedException('Authorization token not found');
    }
  }

  // Helper method to extract token from Authorization header
  private extractTokenFromHeader(request: Request): string | null {
    const bearerToken = request.headers['authorization']; // e.g., "Bearer <token>"
    if (bearerToken && bearerToken.startsWith('Bearer ')) {
      return bearerToken.split(' ')[1];
    }
    return null;
  }
}
