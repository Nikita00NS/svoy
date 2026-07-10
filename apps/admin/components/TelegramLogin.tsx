'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function TelegramLogin() {
  // Password login state
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Bot login state
  const [botLoading, setBotLoading] = useState(false);
  const [botStatus, setBotStatus] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!token) return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/bot/status/${token}`, {
          credentials: 'include',
        });
        const json = await res.json();

        if (json?.approved) {
          const consumeRes = await fetch(`${API_URL}/auth/bot/consume/${token}`, {
            method: 'POST',
            credentials: 'include',
          });

          if (!consumeRes.ok) {
            setBotStatus('Подтверждение получено, но сессия не создалась. Попробуй еще раз.');
            setBotLoading(false);
            window.clearInterval(interval);
            return;
          }

          setBotStatus('✅ Вход подтвержден! Загружаю админку...');
          window.clearInterval(interval);
          window.location.reload();
          return;
        }

        if (json?.found === false) {
          setBotStatus('⏰ Запрос истек. Нажми еще раз.');
          setBotLoading(false);
          window.clearInterval(interval);
        }
      } catch {
        setBotStatus('Ошибка проверки статуса.');
        setBotLoading(false);
        window.clearInterval(interval);
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [token]);

  const submitPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setPwdError(json?.message || json?.error?.message || 'Неверный логин или пароль');
        setPwdLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      setPwdError('Ошибка связи с сервером');
      setPwdLoading(false);
    }
  };

  const requestBotLogin = async () => {
    setBotLoading(true);
    setBotStatus('Отправляю запрос в Telegram...');

    try {
      const res = await fetch(`${API_URL}/auth/bot/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();

      if (!res.ok || !json?.token) {
        setBotStatus('Не удалось отправить запрос в бота. Проверь Railway ENV.');
        setBotLoading(false);
        return;
      }

      setToken(json.token);
      setBotStatus('Я отправил сообщение в @SVOIROBOT. Открой бота и нажми «✅ Да, это я».');
    } catch {
      setBotStatus('Ошибка связи с сервером.');
      setBotLoading(false);
    }
  };

  return (
    <div className="grid" style={{ maxWidth: 720, margin: '0 auto', gap: 16 }}>
      {/* Блок 1 - Пароль */}
      <div className="card">
        <h2>Вход в СВОЙ — быстро по паролю</h2>
        <p className="muted">Введи логин и пароль из Railway ENV (ADMIN_LOGIN / ADMIN_PASSWORD). Рекомендуем admin / СВОЙ2026!</p>
        <form onSubmit={submitPasswordLogin} className="grid" style={{ gap: 12, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
          />
          <input
            className="input"
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button className="btn" type="submit" disabled={pwdLoading || !login || !password}>
            {pwdLoading ? 'Вхожу...' : 'Войти по паролю'}
          </button>
          {pwdError ? <p style={{ color: '#ff6b6b' }}>{pwdError}</p> : null}
        </form>
      </div>

      {/* Блок 2 - Бот */}
      <div className="card">
        <h2>Или вход через Telegram-бота</h2>
        <p className="muted">Нажми кнопку, потом подтверди в чате с @SVOIROBOT. Бот должен оставаться админом в канале.</p>
        <button className="btn secondary" onClick={requestBotLogin} disabled={botLoading} style={{ marginTop: 12 }}>
          {botLoading ? 'Ожидание подтверждения...' : 'Войти через @SVOIROBOT'}
        </button>
        {botStatus ? <p className="muted" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{botStatus}</p> : null}
        {token ? <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Токен: {token.slice(0, 8)}... (живет 10 мин)</p> : null}
      </div>

      <div className="card" style={{ background: '#111' }}>
        <h3 style={{ margin: 0 }}>Как работает модератор-автор?</h3>
        <ul className="muted" style={{ marginTop: 8, lineHeight: '1.6' }}>
          <li>Добавь @SVOIROBOT в канал как админа (удаление сообщений, бан, пост)</li>
          <li>В админке вкладка <b>channels</b> — создай канал с handle и telegramId</li>
          <li>Вкладка <b>content</b> — пиши тексты, кнопка <b>AI Rewrite</b> переписывает через OpenAI (нужен OPENAI_API_KEY в Railway)</li>
          <li>Вкладка <b>rss</b> — добавь новостные RSS, кнопка Fetch забирает</li>
          <li>Бот сам принимает заявки через нижние кнопки в ТГ и складывает в <b>intakes</b></li>
          <li>Вкладка <b>moderation</b> — применяй WARN/MUTE/BAN/DELETE — бот выполнит в канале</li>
        </ul>
      </div>
    </div>
  );
}
