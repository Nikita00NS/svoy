'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type DataState = {
  me: any;
  dashboard: any;
  channels: any[];
  bots: any[];
  intakes: any[];
  loading: boolean;
};

export function DashboardClient() {
  const [state, setState] = useState<DataState>({
    me: null,
    dashboard: null,
    channels: [],
    bots: [],
    intakes: [],
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const meRes = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
      if (!meRes.ok) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const me = await meRes.json();
      const [dashboard, channels, bots, intakes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${API_URL}/admin/channels`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${API_URL}/admin/bots`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${API_URL}/admin/intakes`, { credentials: 'include' }).then((r) => r.json()),
      ]);
      setState({ me, dashboard, channels, bots, intakes, loading: false });
    }
    load();
  }, []);

  if (state.loading) return <div className="card">Загрузка...</div>;
  if (!state.me?.authenticated) return null;

  return (
    <main className="container grid">
      <div>
        <h1>СВОЙ — Панель владельца</h1>
        <p className="muted">Вы вошли как @{state.me.username || 'owner'} · роль: {state.me.role}</p>
      </div>

      <section className="grid grid-4">
        <div className="card"><h3>Пользователи</h3><p>{state.dashboard?.users ?? 0}</p></div>
        <div className="card"><h3>Каналы</h3><p>{state.dashboard?.channels ?? 0}</p></div>
        <div className="card"><h3>Боты</h3><p>{state.dashboard?.bots ?? 0}</p></div>
        <div className="card"><h3>Заявки</h3><p>{state.dashboard?.requests ?? 0}</p></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>Каналы</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Handle</th><th>Активен</th></tr></thead>
            <tbody>
              {state.channels.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.handle || '—'}</td>
                  <td>{item.isActive ? 'Да' : 'Нет'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Боты</h2>
          <table className="table">
            <thead><tr><th>Username</th><th>Webhook</th><th>Master</th></tr></thead>
            <tbody>
              {state.bots.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.username}</td>
                  <td>{item.webhookPath}</td>
                  <td>{item.isMaster ? 'Да' : 'Нет'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Заявки</h2>
        <table className="table">
          <thead>
            <tr><th>Тип</th><th>Пользователь</th><th>Текст</th><th>Медиа</th><th>Создано</th></tr>
          </thead>
          <tbody>
            {state.intakes.map((item: any) => (
              <tr key={item.id}>
                <td>{item.type}</td>
                <td>{item.user?.username || item.user?.telegramUserId || '—'}</td>
                <td>{item.text || '—'}</td>
                <td>{item.mediaType || 'TEXT'}</td>
                <td>{new Date(item.createdAt).toLocaleString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
