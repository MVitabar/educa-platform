import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

export default function VideoPlayer({
  src,
  autoPlay = false,
  controls = true,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hls: Hls | null = null;

    const initPlayer = () => {
      const video = videoRef.current;
      if (!video) return;

      // Verificar si el navegador soporta HLS de forma nativa
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari soporta HLS de forma nativa
        video.src = src;
        if (autoPlay) {
          video.play().catch(error => {
            console.error('Error al reproducir automáticamente:', error);
          });
        }
      } else if (Hls.isSupported()) {
        // Usar hls.js para navegadores que no soportan HLS de forma nativa
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch(error => {
              console.error('Error al reproducir automáticamente:', error);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Error de red al cargar el video');
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Error de medios, intentando recuperar...');
                hls?.recoverMediaError();
                break;
              default:
                console.error('Error al cargar el video');
                break;
            }
          }
        });
      } else {
        console.error('Tu navegador no soporta la reproducción de este tipo de video');
      }
    };

    initPlayer();

    return () => {
      // Limpiar recursos al desmontar
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      className={`w-full h-full object-cover ${className}`}
      controls={controls}
      playsInline
      preload="metadata"
    >
      <source src={src} type="application/x-mpegURL" />
      Tu navegador no soporta la reproducción de videos HLS.
    </video>
  );
}
