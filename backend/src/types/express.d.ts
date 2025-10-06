import { UserDocument } from './user.types';

// Type definition for uploaded files
interface UploadedFile {
  name: string;
  mv: (path: string, callback?: (err: any) => void) => Promise<void>;
  data: Buffer;
  encoding: string;
  mimetype: string;
  tempFilePath: string;
  truncated: boolean;
  size: number;
  md5: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      file?: UploadedFile;
      files?: {
        [fieldname: string]: UploadedFile | UploadedFile[];
      } & {
        file?: UploadedFile;
      };
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

export interface IRequest extends Express.Request {
  files?: {
    [fieldname: string]: UploadedFile | UploadedFile[];
  } & {
    file?: UploadedFile;
  };
}

export {};
