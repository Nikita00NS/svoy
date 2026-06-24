'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'svoy_master_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.svoy.local'}/api/auth/telegram/login`);
    script.setAttribute('data-request-access', 'write');
    
    const container = document.getElementById('tg-login');
    if (container) container.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
      <div className="card w-full max-w-md text-center">
        <div className="mb-8">
          <div className="text-4xl font-bold text-[#e53935]">СВОЙ</div>
          <p className="text-gray-400 mt-2">Административная панель</p>
        </div>

        <div id="tg-login" className="flex justify-center"></div>

        <p className="text-xs text-gray-500 mt-6">
          Вход только для владельца (Owner)
        </p>
      </div>
    </div>
  );
}
