'use client';

export default function ModerationPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Модерация</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Последние события</h3>
          <div className="text-sm text-gray-400">Нет событий (демо)</div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Правила модерации</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>PROFANITY</span><span className="text-red-400">WARN</span></div>
            <div className="flex justify-between"><span>CASINO</span><span className="text-red-400">DELETE</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
