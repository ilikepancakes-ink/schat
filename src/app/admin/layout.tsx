import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - SchoolChat',
  description: 'Administrative interface for SchoolChat secure messaging platform',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
