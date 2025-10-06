import { Response } from 'express';
import { cloudinary } from '../config/cloudinary.config';
import { IRequest } from '../types/express';
import fs from 'fs';
import path from 'path';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  width?: number;
  height?: number;
  bytes: number;
}

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

export const uploadFile = async (req: IRequest, res: Response): Promise<Response | void> => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No se ha subido ningún archivo' 
      });
    }

    const file = req.files.file as UploadedFile;
    const uploadPath = `/tmp/${file.name}`;

    // Guardar el archivo temporalmente
    await file.mv(uploadPath);

    // Subir a Cloudinary
    const result: CloudinaryUploadResult = await cloudinary.uploader.upload(uploadPath, {
      folder: 'educa-platform',
      resource_type: 'auto'
    });

    // Eliminar el archivo temporal
    const fs = require('fs');
    fs.unlinkSync(uploadPath);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      }
    });
  } catch (error: any) {
    console.error('Error al subir el archivo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al subir el archivo',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const deleteFile = async (req: IRequest, res: Response) => {
  try {
    const { public_id, resource_type = 'image' } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: 'Se requiere el ID público del archivo' });
    }

    await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type === 'video' ? 'video' : 'image'
    });

    res.status(200).json({
      success: true,
      message: 'Archivo eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar el archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el archivo',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
