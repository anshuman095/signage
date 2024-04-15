import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor() {}

  validateToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
  }
}
