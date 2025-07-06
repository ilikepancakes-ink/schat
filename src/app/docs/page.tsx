import { Metadata } from 'next';
import ApiDocumentation from '@/components/docs/ApiDocumentation';

export const metadata: Metadata = {
  title: 'API Documentation - Schat',
  description: 'Complete API reference for Schat - Authentication, messaging, user management, security features, and admin functions. Includes request/response examples and integration guides.',
  keywords: 'API documentation, REST API reference, Schat API, messaging API docs, authentication API, security API, developer documentation',
  authors: [{ name: 'Schat Development Team' }],
  openGraph: {
    title: 'API Documentation - Schat',
    description: 'Complete API reference for Schat with authentication, messaging, user management, and security features.',
    type: 'website',
    siteName: 'Schat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Documentation - Schat',
    description: 'Complete API reference for Schat with authentication, messaging, user management, and security features.',
  },
};

export default function DocsPage() {
  return <ApiDocumentation />;
}
