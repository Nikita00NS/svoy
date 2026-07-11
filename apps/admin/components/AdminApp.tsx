'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const tabs = ['dashboard', 'users', 'intakes', 'channels', 'bots', 'content', 'moderation', 'rss', 'audit'] as const;
type TabKey = typeof tabs[number];

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok || json?.success === false) throw new Error(`API ${path} failed`);
  return json?.data ?? json;
}

function unwrap(data: any) {
  return Array.isArray(data) ? data : data?.items || [];
}

export function AdminApp() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [filters, setFilters] = useState({ intake: '', content: '', users: '' });
  const [data, setData] = useState<any>({ dashboard: null, users: [], intakes: [], channels: [], bots: [], content: [], moderation: [], rss: [], audit: [] });
  const [forms, setForms] = useState<any>({
    channel: { title: '', handle: '', telegramId: '', postWatermark: 'СВОЙ' },
    bot: { username: '', tokenRef: '', webhookPath: '', internalKey: '' },
    moderation: { chatId: '', targetTelegramId: '', messageId: '', action: 'WARN', reason: '' },
    rss: { title: '', url: '' },
    schedule: {},
  });

  const loadAll = async () => {
    const meRes = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    const meJson = meRes.ok ? await meRes.json() : null;
    const meData = meJson?.data ?? meJson;
    setMe(meData);
    if (!meData?.authenticated) { setLoading(false); return; }
    const [dashboard, users, intakes, channels, bots, content, moderation, rss, audit] = await Promise.all([
      api('/admin/dashboard'),
      api('/users?limit=50'),
      api('/admin/intakes?limit=50'),
      api('/channels'),
      api('/bots'),
      api('/content?limit=50'),
      api('/moderation'),
      api('/rss'),
      api('/audit?limit=50'),
    ]);
    setData({ dashboard, users: unwrap(users), intakes: unwrap(intakes), channels, bots, content: unwrap(content), moderation, rss, audit: unwrap(audit) });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);
  const authed = useMemo(() => me?.authenticated, [me]);

  async function submit(path: string, body: any, method = 'POST') {
    await api(path, { method, body: JSON.stringify(body) });
    await loadAll();
  }

  async function remove(path: string) {
    await api(path, { method: 'DELETE' });
    await loadAll();
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  const filteredUsers = data.users.filter((item: any) => !filters.users || `${item.username || ''} ${item.telegramUserId}`.toLowerCase().includes(filters.users.toLowerCase()));
  const filteredIntakes = data.intakes.filter((item: any) => !filters.intake || `${item.type} ${item.text || ''}`.toLowerCase().includes(filters.intake.toLowerCase()));
  const filteredContent = data.content.filter((item: any) => !filters.content || `${item.title || ''} ${item.body || ''} ${item.status || ''}`.toLowerCase().includes(filters.content.toLowerCase()));

  if (loading) return <main className="container"><div className="card">Загрузка...</div></main>;
  if (!authed) return null;

  return (
    <main className="container grid">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>СВОЙ — Панель владельца</h1>
          <p className="muted">@{me.username || 'owner'} · {me.role}</p>
        </div>
        <div className="row">
          <button className="btn secondary" onClick={() => submit('/admin/setup/master-bot', {})}>Настроить webhook</button>
          <button className="btn secondary" onClick={logout}>Выйти</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((item) => <button key={item} className={`tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === 'dashboard' && <section className="grid grid-4">{Object.entries(data.dashboard || {}).map(([key, value]) => <div className="card" key={key}><h3>{key}</h3><p>{String(value)}</p></div>)}</section>}
      {tab === 'users' && <section className="card"><div className="row" style={{ justifyContent: 'space-between' }}><h2>Пользователи и роли</h2><input className="input" style={{ maxWidth: 320 }} placeholder="Поиск user" value={filters.users} onChange={(e) => setFilters({ ...filters, users: e.target.value })} /></div><table className="table"><thead><tr><th>Username</th><th>Telegram ID</th><th>Role</th><th>Active</th><th>Action</th></tr></thead><tbody>{filteredUsers.map((item: any) => <tr key={item.id}><td>{item.username || '—'}</td><td>{item.telegramUserId}</td><td>{item.role}</td><td>{item.isActive ? 'Да' : 'Нет'}</td><td><div className="row"><button className="btn secondary" onClick={() => submit(`/users/${item.id}`, { role: 'MODERATOR' }, 'PATCH')}>MOD</button><button className="btn secondary" onClick={() => submit(`/users/${item.id}`, { role: 'EDITOR' }, 'PATCH')}>EDITOR</button><button className="btn secondary" onClick={() => submit(`/users/${item.id}`, { role: 'SUPPORT' }, 'PATCH')}>SUPPORT</button><button className="btn secondary" onClick={() => remove(`/users/${item.id}`)}>Delete</button></div></td></tr>)}</tbody></table></section>}
      {tab === 'intakes' && <section className="card"><div className="row" style={{ justifyContent: 'space-between' }}><h2>Заявки</h2><input className="input" style={{ maxWidth: 320 }} placeholder="Фильтр по типу/тексту" value={filters.intake} onChange={(e) => setFilters({ ...filters, intake: e.target.value })} /></div><table className="table"><thead><tr><th>Тип</th><th>Статус</th><th>Пользователь</th><th>Текст</th><th>Медиа</th></tr></thead><tbody>{filteredIntakes.map((item: any) => <tr key={item.id}><td>{item.type}</td><td>{item.status}</td><td>{item.user?.username || item.user?.telegramUserId || '—'}</td><td>{item.text || '—'}</td><td>{item.mediaType || 'TEXT'}</td></tr>)}</tbody></table></section>}
      {tab === 'channels' && <div className="grid grid-2"><section className="card"><h2>Создать канал</h2><div className="grid"><input className="input" placeholder="Название" value={forms.channel.title} onChange={(e) => setForms({ ...forms, channel: { ...forms.channel, title: e.target.value } })} /><input className="input" placeholder="Handle" value={forms.channel.handle} onChange={(e) => setForms({ ...forms, channel: { ...forms.channel, handle: e.target.value } })} /><input className="input" placeholder="Telegram ID" value={forms.channel.telegramId} onChange={(e) => setForms({ ...forms, channel: { ...forms.channel, telegramId: e.target.value } })} /><input className="input" placeholder="Watermark" value={forms.channel.postWatermark} onChange={(e) => setForms({ ...forms, channel: { ...forms.channel, postWatermark: e.target.value } })} /><button className="btn" onClick={() => submit('/channels', forms.channel)}>Создать</button></div></section><section className="card"><h2>Список каналов</h2><table className="table"><thead><tr><th>Название</th><th>Handle</th><th>ID</th><th>Watermark</th></tr></thead><tbody>{data.channels.map((item: any) => <tr key={item.id}><td>{item.title}</td><td>{item.handle || '—'}</td><td>{item.telegramId || '—'}</td><td>{item.postWatermark || '—'}</td></tr>)}</tbody></table></section></div>}
      {tab === 'bots' && <div className="grid grid-2"><section className="card"><h2>Добавить бота</h2><div className="grid"><input className="input" placeholder="Username" value={forms.bot.username} onChange={(e) => setForms({ ...forms, bot: { ...forms.bot, username: e.target.value } })} /><input className="input" placeholder="token_ref" value={forms.bot.tokenRef} onChange={(e) => setForms({ ...forms, bot: { ...forms.bot, tokenRef: e.target.value } })} /><input className="input" placeholder="webhook_path" value={forms.bot.webhookPath} onChange={(e) => setForms({ ...forms, bot: { ...forms.bot, webhookPath: e.target.value } })} /><input className="input" placeholder="internal_key" value={forms.bot.internalKey} onChange={(e) => setForms({ ...forms, bot: { ...forms.bot, internalKey: e.target.value } })} /><button className="btn" onClick={() => submit('/bots', forms.bot)}>Создать</button></div></section><section className="card"><h2>Боты</h2><table className="table"><thead><tr><th>Username</th><th>Webhook</th><th>Master</th></tr></thead><tbody>{data.bots.map((item: any) => <tr key={item.id}><td>{item.username}</td><td>{item.webhookPath}</td><td>{item.isMaster ? 'Да' : 'Нет'}</td></tr>)}</tbody></table></section></div>}
      {tab === 'content' && <section className="card"><div className="row" style={{ justifyContent: 'space-between' }}><h2>Контент</h2><input className="input" style={{ maxWidth: 320 }} placeholder="Фильтр по title/body/status" value={filters.content} onChange={(e) => setFilters({ ...filters, content: e.target.value })} /></div><table className="table"><thead><tr><th>Title</th><th>Status</th><th>Body</th><th>AI</th><th>Media</th><th>Actions</th></tr></thead><tbody>{filteredContent.map((item: any) => <tr key={item.id}><td>{item.title || '—'}</td><td>{item.status}</td><td>{item.body || '—'}</td><td>{item.aiRewrittenText || '—'}</td><td>{item.processedMediaPath || item.localMediaPath || item.mediaFileId || '—'}</td><td><div className="row"><button className="btn secondary" onClick={() => submit(`/content/${item.id}/download-media`, {})}>Download media</button><button className="btn secondary" onClick={() => submit(`/content/${item.id}/rewrite`, {})}>AI Rewrite</button><button className="btn secondary" onClick={() => submit(`/content/${item.id}/approve`, {})}>Approve</button><button className="btn secondary" onClick={() => submit(`/content/${item.id}/process-watermark`, {})}>Watermark</button><button className="btn secondary" onClick={() => submit(`/content/${item.id}/publish-now`, {})}>Publish now</button><button className="btn secondary" onClick={() => remove(`/content/${item.id}`)}>Delete</button><input className="input" type="datetime-local" value={forms.schedule[item.id] || ''} onChange={(e) => setForms({ ...forms, schedule: { ...forms.schedule, [item.id]: e.target.value } })} /><button className="btn secondary" onClick={() => submit(`/content/${item.id}/schedule`, { scheduledFor: forms.schedule[item.id] })}>Schedule</button></div></td></tr>)}</tbody></table></section>}
      {tab === 'moderation' && <div className="grid grid-2"><section className="card"><h2>Модерация</h2><div className="grid"><input className="input" placeholder="Chat ID" value={forms.moderation.chatId} onChange={(e) => setForms({ ...forms, moderation: { ...forms.moderation, chatId: e.target.value } })} /><input className="input" placeholder="Target Telegram ID" value={forms.moderation.targetTelegramId} onChange={(e) => setForms({ ...forms, moderation: { ...forms.moderation, targetTelegramId: e.target.value } })} /><input className="input" placeholder="Message ID" value={forms.moderation.messageId} onChange={(e) => setForms({ ...forms, moderation: { ...forms.moderation, messageId: e.target.value } })} /><select className="select" value={forms.moderation.action} onChange={(e) => setForms({ ...forms, moderation: { ...forms.moderation, action: e.target.value } })}><option>WARN</option><option>MUTE</option><option>BAN</option><option>DELETE</option></select><textarea className="textarea" placeholder="Причина" value={forms.moderation.reason} onChange={(e) => setForms({ ...forms, moderation: { ...forms.moderation, reason: e.target.value } })} /><button className="btn" onClick={() => submit('/moderation/apply', { ...forms.moderation, messageId: forms.moderation.messageId ? Number(forms.moderation.messageId) : undefined })}>Применить</button><button className="btn secondary" onClick={() => submit('/moderation/escalate', { chatId: forms.moderation.chatId, targetTelegramId: forms.moderation.targetTelegramId, reason: forms.moderation.reason })}>Escalate</button></div></section><section className="card"><h2>История</h2><table className="table"><thead><tr><th>Action</th><th>Target</th><th>Reason</th></tr></thead><tbody>{data.moderation.map((item: any) => <tr key={item.id}><td>{item.action}</td><td>{item.targetTelegramId}</td><td>{item.reason || '—'}</td></tr>)}</tbody></table></section></div>}
      {tab === 'rss' && <div className="grid grid-2"><section className="card"><h2>RSS источник</h2><div className="grid"><input className="input" placeholder="Название" value={forms.rss.title} onChange={(e) => setForms({ ...forms, rss: { ...forms.rss, title: e.target.value } })} /><input className="input" placeholder="URL" value={forms.rss.url} onChange={(e) => setForms({ ...forms, rss: { ...forms.rss, url: e.target.value } })} /><button className="btn" onClick={() => submit('/rss', forms.rss)}>Добавить RSS</button></div></section><section className="card"><h2>Источники</h2><table className="table"><thead><tr><th>Название</th><th>URL</th><th></th></tr></thead><tbody>{data.rss.map((item: any) => <tr key={item.id}><td>{item.title}</td><td>{item.url}</td><td><button className="btn secondary" onClick={() => submit(`/rss/${item.id}/fetch`, {})}>Fetch</button></td></tr>)}</tbody></table></section></div>}
      {tab === 'audit' && <section className="card"><h2>Audit log</h2><table className="table"><thead><tr><th>Action</th><th>Entity</th><th>Entity ID</th><th>When</th></tr></thead><tbody>{data.audit.map((item: any) => <tr key={item.id}><td>{item.action}</td><td>{item.entityType}</td><td>{item.entityId || '—'}</td><td>{new Date(item.createdAt).toLocaleString('ru-RU')}</td></tr>)}</tbody></table></section>}
    </main>
  );
}
