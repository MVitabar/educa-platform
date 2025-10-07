import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import Image from 'next/image';
import 'highlight.js/styles/github-dark.css';

// Tipos para los props de los componentes personalizados
interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string;
  children: React.ReactNode;
}

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

// Componente personalizado para enlaces que se abren en una nueva pestaña
const LinkRenderer = ({ href = '', children, ...props }: LinkProps) => {
  const isInternalLink = href.startsWith('/') || href.startsWith('#');
  
  return (
    <a 
      href={href} 
      target={isInternalLink ? undefined : "_blank"}
      rel={isInternalLink ? undefined : "noopener noreferrer"}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      {...props}
    >
      {children}
    </a>
  );
};

// Componente personalizado para imágenes responsivas
const ImageRenderer = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const { src, alt = '', ...rest } = props;
  
  if (!src) return null;
  
  // Asegurarse de que src sea un string
  const imageSrc = typeof src === 'string' ? src : '';
  
  // Extraer solo las props necesarias para la imagen
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { width, height, ...imageProps } = rest;
  
  return (
    <div className="relative w-full h-64 md:h-96 my-4">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-contain rounded-lg shadow-lg"
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 50vw"
        {...imageProps}
      />
    </div>
  );
};

// Componente personalizado para bloques de código
interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  $isInline?: boolean;
  children?: React.ReactNode;
}

const CodeBlock = ({ 
  className = '', 
  children, 
  $isInline = false,
  ...props 
}: CodeBlockProps) => {
  if ($isInline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  }
  
  return (
    <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto my-4">
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  );
};

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  // Memoizamos el contenido para evitar re-renderizados innecesarios
  const memoizedContent = useMemo(() => content, [content]);

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: (props) => <LinkRenderer {...props} href={props.href || '#'}>{props.children}</LinkRenderer>,
          img: (props) => <ImageRenderer {...props} alt={props.alt || ''} />,
code: ({ className = '', children, ...props }) => {
            const isInline = 'inline' in props ? Boolean(props.inline) : false;
            return (
              <CodeBlock 
                className={className} 
                $isInline={isInline}
                {...props}
              >
                {children}
              </CodeBlock>
            );
          },
          // Personalización de encabezados y otros elementos
          h1: (props) => <h1 className="text-3xl font-bold my-6" {...props} />,
          h2: (props) => <h2 className="text-2xl font-bold my-5" {...props} />,
          h3: (props) => <h3 className="text-xl font-semibold my-4" {...props} />,
          p: (props) => <p className="my-4 leading-relaxed" {...props} />,
          ul: (props) => <ul className="list-disc pl-6 my-3" {...props} />,
          ol: (props) => <ol className="list-decimal pl-6 my-3" {...props} />,
          blockquote: (props) => (
            <blockquote 
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-4 text-gray-700 dark:text-gray-300" 
              {...props} 
            />
          ),
        }}
      >
        {memoizedContent}
      </ReactMarkdown>
    </div>
  );
}
