'use client';

import Script from 'next/script';

declare global { interface Window { onTelegramAuth?: (user: Record<string, string>) => void; } }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function TelegramLogin() {
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || '';

  if (typeof window !== 'undefined') {
    window.onTelegramAuth = async (user: Record<string, string>) => {
      const res = await fetch(`${API_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(user),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) return alert('Ошибка входа через Telegram');
      window.location.reload();
    };
  }

  return (
    <div className="card">
      <h2>Вход в админ-панель</h2>
      <p className="muted">Доступ только для владельца Telegram ID 7320418026.</p>
      {botUsername ? (
        <Script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login={botUsername}
          data-size="large"
          data-userpic="false"
          data-radius="10"
          data-request-access="write"
          data-onauth="onTelegramAuth(user)"
        />
      ) : (
        <p className="muted">Укажите NEXT_PUBLIC_BOT_USERNAME в .env.</p>
      )}
    </div>
  );
}
