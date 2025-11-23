import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BudLife',
  description: 'Leichtgewichtiges Idle-Webgame im Cannabis-Farm-Stil.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/uicons-solid-rounded/css/uicons-solid-rounded.css"
        />
      </head>
      <body className="with-sidebar">{children}</body>
    </html>
  );
}
