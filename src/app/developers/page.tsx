import { Metadata } from 'next';
import DeveloperLandingPage from '@/components/docs/DeveloperLandingPage';

export const metadata: Metadata = {
  title: 'Developers - Schat API',
  description: 'Build with Schat API - Integrate secure messaging, user management, and cybersecurity features into your applications with our comprehensive REST API.',
  keywords: 'API, developers, REST API, messaging API, secure chat API, cybersecurity API, integration, documentation',
  authors: [{ name: 'Schat Development Team' }],
  openGraph: {
    title: 'Developers - Schat API',
    description: 'Build with Schat API - Integrate secure messaging, user management, and cybersecurity features into your applications.',
    type: 'website',
    siteName: 'Schat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developers - Schat API',
    description: 'Build with Schat API - Integrate secure messaging, user management, and cybersecurity features into your applications.',
  },
};

export default function DevelopersPage() {
  return <DeveloperLandingPage />;
}
