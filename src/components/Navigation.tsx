import React from 'react';
import { Home, Music, User, Settings, Trophy } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'ホーム' },
    { id: 'library', icon: Music, label: 'ライブラリ' },
    { id: 'achievements', icon: Trophy, label: '実績' },
    { id: 'profile', icon: User, label: 'プロフィール' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-teal-100 text-teal-600 transform scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-teal-600' : 'text-current'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-teal-600' : 'text-current'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}