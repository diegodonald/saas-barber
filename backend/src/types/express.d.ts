import { JWTUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: JWTUser;
    }
  }
}

export {};
