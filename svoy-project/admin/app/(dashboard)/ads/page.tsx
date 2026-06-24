'use client';

export default function AdsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">CRM Реклама</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Рекламодатель</th><th>Пакет</th><th>Статус</th><th>Сумма</th><th>Действия</th></tr>
          </thead>
          <tbody>
            <tr><td>ООО "Реклама"</td><td>STANDARD_POST</td><td>PAID</td><td>5000 ₽</td><td><button className="btn text-sm">Approve</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
