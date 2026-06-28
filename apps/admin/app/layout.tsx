import './globals.css';
import React from 'react';

export const metadata = { title: 'СВОЙ Admin', description: 'Панель управления проектом СВОЙ' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
