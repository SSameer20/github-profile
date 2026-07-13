import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'GitHub Profile Card Generator',
  description: 'Connect GitHub and generate a terminal-style profile preview.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
