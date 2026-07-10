'use client';

import { useEffect, useState } from 'react';
import { AdminApp } from '../components/AdminApp';
import { TelegramLogin } from '../components/TelegramLogin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
        const json = await res.json();
        const data = json?.data ?? json;
        setAuthed(!!data?.authenticated);
      } catch {
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="container">
        <div className="card">Загрузка СВОЙ...</div>
      </main>
    );
  }

  return (
    <>
      <main className="container">
        <h1>СВОЙ — Admin</h1>
        {!authed ? <TelegramLogin /> : null}
      </main>
      {authed ? <AdminApp /> : null}
    </>
  );
}
