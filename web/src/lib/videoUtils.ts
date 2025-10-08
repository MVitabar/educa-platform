/**
 * Extrae el ID de un video de YouTube desde una URL
 */
export const getYoutubeVideoId = (url: string): string | null => {
  // Extraer el ID del video de diferentes formatos de URL de YouTube
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

/**
 * Obtiene la URL de la miniatura de un video de YouTube
 * @param youtubeUrl URL del video de YouTube
 * @param quality Calidad de la miniatura: 'default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'
 * @returns URL de la miniatura o null si no se puede extraer el ID
 */
export const getYoutubeThumbnail = (youtubeUrl: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string | null => {
  try {
    const videoId = getYoutubeVideoId(youtubeUrl);
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  } catch (error) {
    console.error('Error al obtener la miniatura de YouTube:', error);
    return null;
  }
};

/**
 * Verifica si una URL es de YouTube
 */
export const isYoutubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};
