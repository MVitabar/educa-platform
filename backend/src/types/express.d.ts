import { UserDocument } from '../types/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      body: any;
      params: any;
      query: any;
    }

    interface Response {
      status(code: number): this;
      json(body: any): this;
      cookie(name: string, value: string, options?: any): this;
      clearCookie(name: string, options?: any): this;
    }
  }
}

export {};
