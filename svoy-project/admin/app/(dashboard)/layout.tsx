'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OwnerGuard from '../../components/OwnerGuard';
import { LogOut } from 'lucide-react';

const nav = [
  { href: '/(dashboard)', label: 'Дашборд' },
  { href: '/(dashboard)/content', label: 'Контент' },
  { href: '/(dashboard)/moderation', label: 'Модерация' },
  { href: '/(dashboard)/ads', label: 'Реклама' },
  { href: '/(dashboard)/appeals', label: 'Апелляции' },
  { href: '/(dashboard)/jobs', label: 'Вакансии' },
  { href: '/(dashboard)/support', label: 'Поддержка' },
  { href: '/(dashboard)/sources', label: 'Источники' },
  { href: '/(dashboard)/channels', label: 'Каналы' },
  { href: '/(dashboard)/analytics', label: 'Аналитика' },
  { href: '/(dashboard)/settings', label: 'Настройки' },
  { href: '/(dashboard)/users', label: 'Пользователи' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <OwnerGuard>
      <div className="flex h-screen bg-[#0b0b0f] text-white">
        {/* Sidebar */}
        <div className="w-64 bg-[#15151d] border-r border-[#27272a] p-4 flex flex-col">
          <div className="px-4 py-3">
            <div className="text-2xl font-bold text-[#e53935]">СВОЙ</div>
            <div className="text-xs text-gray-400">Админ-панель</div>
          </div>

          <nav className="mt-8 flex-1">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2.5 rounded-xl mb-1 text-sm transition-colors ${
                    isActive ? 'bg-[#e53935] text-white' : 'hover:bg-[#27272a]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-[#27272a]">
            <button 
              onClick={() => window.location.href = '/login'}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </OwnerGuard>
  );
}
