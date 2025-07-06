import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Book } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export const metadata: Metadata = {
  title: {
    template: '%s | Schat API Docs',
    default: 'Schat API Documentation',
  },
  description: 'Complete API documentation for Schat - authentication, messaging, user management, and security features.',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Documentation Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Schat</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center">
                <Book className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">API Documentation</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/developers"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Developer Hub
              </Link>
              <ThemeToggle />
              <Link
                href="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Get Access
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {children}
    </div>
  );
}
