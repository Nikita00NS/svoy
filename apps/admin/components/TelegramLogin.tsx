'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function TelegramLogin() {
  const [login, setLogin] = useState('RUPYT');
  const [password, setPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [botLoading, setBotLoading] = useState(false);
  const [botStatus, setBotStatus] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/bot/status/${token}`, { credentials: 'include' });
        const json = await res.json();
        if (json?.approved) {
          const consumeRes = await fetch(`${API_URL}/auth/bot/consume/${token}`, { method: 'POST', credentials: 'include' });
          if (!consumeRes.ok) {
            setBotStatus('Подтверждено, но сессия не создалась. Обнови страницу.');
            setBotLoading(false);
            window.clearInterval(interval);
            return;
          }
          setBotStatus('Успешно! Загружаю...');
          window.clearInterval(interval);
          window.location.reload();
          return;
        }
        if (json?.found === false) {
          setBotStatus('Запрос истек');
          setBotLoading(false);
          window.clearInterval(interval);
        }
      } catch {
        setBotStatus('Ошибка проверки');
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
    setBotStatus('Отправляю запрос...');
    try {
      const res = await fetch(`${API_URL}/auth/bot/request`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok || !json?.token) {
        setBotStatus('Не удалось отправить запрос');
        setBotLoading(false);
        return;
      }
      setToken(json.token);
      setBotStatus('Открой @SVOIROBOT и нажми «Да, это я»');
    } catch {
      setBotStatus('Ошибка связи');
      setBotLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '80px auto 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 28, color: '#fff' }}>С</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Вход в СВОЙ</div>
          <div style={{ color: '#9a9aab', fontSize: 14, marginTop: 4 }}>Панель владельца сети каналов</div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submitPasswordLogin} className="grid" style={{ gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#9a9aab', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 8 }}>Логин</div>
            <input className="input" placeholder="Введите логин" value={login} onChange={(e) => setLogin(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#9a9aab', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 8 }}>Пароль</div>
            <input className="input" placeholder="Введите пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn accent" type="submit" disabled={pwdLoading || !login || !password} style={{ width: '100%' }}>
            {pwdLoading ? 'Входим...' : 'Войти'}
          </button>
          {pwdError ? <div style={{ color: '#f87171', fontSize: 13 }}>{pwdError}</div> : null}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0', color: '#9a9aab', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          <div style={{ flex: 1, height: 1, background: '#262631' }} /> или <div style={{ flex: 1, height: 1, background: '#262631' }} />
        </div>

        <button className="btn secondary" onClick={requestBotLogin} disabled={botLoading} style={{ width: '100%' }}>
          {botLoading ? 'Жду подтверждения...' : 'Войти через @SVOIROBOT'}
        </button>
        {botStatus ? <div className="muted" style={{ marginTop: 12, fontSize: 13, textAlign: 'center', whiteSpace: 'pre-wrap' }}>{botStatus}</div> : null}
      </div>
    </div>
  );
}
