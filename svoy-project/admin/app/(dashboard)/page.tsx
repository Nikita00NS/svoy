'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    // Mock stats for now
    setStats({
      content: 124,
      orders: 18,
      events: 7,
      users: 3,
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Дашборд «СВОЙ»</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="card">
          <div className="text-sm text-gray-400">Контент</div>
          <div className="text-4xl font-bold mt-2">{stats.content}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-400">Заказы рекламы</div>
          <div className="text-4xl font-bold mt-2">{stats.orders}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-400">Модерация</div>
          <div className="text-4xl font-bold mt-2">{stats.events}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-400">Пользователи</div>
          <div className="text-4xl font-bold mt-2">{stats.users}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Быстрые действия</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/(dashboard)/content" className="btn">Управление контентом</a>
          <a href="/(dashboard)/moderation" className="btn-secondary">Модерация</a>
          <a href="/(dashboard)/ads" className="btn-secondary">Реклама CRM</a>
        </div>
      </div>
    </div>
  );
}
