// Type definitions for express-fileupload
// Project: https://github.com/richardgirges/express-fileupload

declare module 'express-fileupload' {
  import { RequestHandler } from 'express';

  interface FileArray {
    [fieldname: string]: UploadedFile | UploadedFile[];
  }

  interface UploadedFile {
    name: string;
    mv(path: string, callback: (err: any) => void): void;
    mv(path: string): Promise<void>;
    encoding: string;
    mimetype: string;
    data: Buffer;
    tempFilePath: string;
    truncated: boolean;
    size: number;
    md5: string;
  }

  interface Options {
    debug?: boolean;
    preserveExtension?: boolean | string | number;
    safeFileNames?: boolean;
    abortOnLimit?: boolean;
    responseOnLimit?: string;
    limitHandler?: boolean | ((req: any, res: any, next: any) => any);
    createParentPath?: boolean;
    parseNested?: boolean;
    useTempFiles?: boolean;
    tempFileDir?: string;
    uriDecodeFileNames?: boolean;
    uploadTimeout?: number;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
  }

  function fileUpload(options?: Options): RequestHandler;

  export = fileUpload;
}
