import { Document } from 'mongoose';

export interface IAuthTokenPayload {
  id: string;
  role: 'student' | 'instructor' | 'admin';
  iat?: number;
  exp?: number;
}

export interface ILoginResponse {
  success: boolean;
  token: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'student' | 'instructor' | 'admin';
      avatar?: string;
    };
  };
}

export interface IRegisterResponse {
  success: boolean;
  token: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'student' | 'instructor' | 'admin';
      avatar?: string;
    };
  };
}

export interface IAuthUser extends Document {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
}
