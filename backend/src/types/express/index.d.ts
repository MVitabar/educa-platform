import { IUser } from '../user.types';
import { UploadedFile } from 'express-fileupload';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      file?: UploadedFile;
      files?: {
        [fieldname: string]: UploadedFile | UploadedFile[];
      } & {
        file?: UploadedFile;
      };
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
