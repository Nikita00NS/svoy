'use client';

import { useState } from 'react';

export default function ContentPage() {
  const [items] = useState([
    { id: 1, title: 'Новость 1', status: 'APPROVED', channel: 'svoy_moscow' },
    { id: 2, title: 'Новость 2', status: 'MANUAL_REVIEW', channel: 'svoy_moscow' },
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Контент</h1>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Статус</th>
              <th>Канал</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td><span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">{item.status}</span></td>
                <td>{item.channel}</td>
                <td>
                  <button className="btn text-sm px-3 py-1">Approve</button>
                  <button className="btn-secondary text-sm px-3 py-1 ml-2">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
