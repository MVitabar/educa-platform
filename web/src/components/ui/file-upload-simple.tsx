'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadSimpleProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  label?: string;
  buttonText?: string;
  previewUrl?: string | null;
}

export function FileUploadSimple({
  onFileSelected,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  label = 'Arrastra y suelta la imagen aquí, o haz clic para seleccionar',
  buttonText = 'Seleccionar imagen',
  previewUrl = null,
}: FileUploadSimpleProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validar tamaño
      if (file.size > maxSize) {
        setError(`El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`);
        return;
      }

      setError(null);
      onFileSelected(file);
    },
    [maxSize, onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple: false,
    onDropRejected: () => {
      setError('Tipo de archivo no soportado. Por favor, sube una imagen.');
    },
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="h-12 w-12 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            {isDragActive ? 'Suelta la imagen aquí' : label}
          </p>
          <button
            type="button"
            className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {buttonText}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {previewUrl && (
        <div className="mt-4">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={previewUrl}
              alt="Vista previa"
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
