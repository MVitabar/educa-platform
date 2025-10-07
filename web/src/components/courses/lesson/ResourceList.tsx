import { Resource } from '@/types/lesson';
import { FileIcon, Download } from 'lucide-react';

interface ResourceListProps {
  resources: Resource[];
}
const getFileTypeIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileIcon className="w-5 h-5 text-red-500" />;
    case 'doc':
      return <FileIcon className="w-5 h-5 text-blue-500" />;
    case 'zip':
      return <FileIcon className="w-5 h-5 text-yellow-500" />;
    default:
      return <FileIcon className="w-5 h-5 text-gray-500" />;
  }
};

export default function ResourceList({ resources }: ResourceListProps) {
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <ul className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
      {resources.map((resource) => (
        <li key={resource._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getFileTypeIcon(resource.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {resource.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {resource.type.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-gray-400 hover:text-blue-500 transition-colors">
              <Download className="w-5 h-5" />
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
