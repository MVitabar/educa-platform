import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    public_id: string;
    format: string;
    resource_type: 'image' | 'video' | 'raw';
    width?: number;
    height?: number;
    bytes: number;
  };
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<UploadResponse>(
    `${API_URL}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  return response.data;
};

export const deleteFile = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> => {
  await axios.delete(`${API_URL}/upload`, {
    data: { public_id: publicId, resource_type: resourceType },
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
};
