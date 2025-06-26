import React from 'react';
import { User, Trophy, Zap, Star, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function UserProfile() {
  const { state } = useApp();
  const { user } = state;

  const xpPercentage = (user.xp % 100);
  const totalXpForCurrentLevel = user.level * 100;
  const currentLevelXp = user.xp % 100;

  // Calculate level progress
  const levelProgress = (currentLevelXp / 100) * 100;

  // Mock badges for demonstration
  const mockBadges = [
    { name: '初回ウォーク', icon: '🚶', rarity: 'common' as const },
    { name: '音楽愛好家', icon: '🎵', rarity: 'rare' as const },
    { name: '早起き鳥', icon: '🌅', rarity: 'epic' as const },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">レベル {user.level}</span>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">経験値</span>
          <span className="text-sm text-gray-500">{currentLevelXp}/100 XP</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          次のレベルまで {100 - currentLevelXp} XP
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-teal-50 rounded-xl">
          <p className="text-2xl font-bold text-teal-600">{user.totalWalks}</p>
          <p className="text-xs text-teal-700">ウォーク</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-xl">
          <p className="text-2xl font-bold text-purple-600">{user.totalTracks}</p>
          <p className="text-xs text-purple-700">楽曲</p>
        </div>
      </div>

      {/* Recent Badges */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">バッジ</span>
          <Trophy className="w-4 h-4 text-yellow-500" />
        </div>
        
        {mockBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {mockBadges.slice(0, 3).map((badge, index) => (
              <div key={index} className={`text-center p-2 rounded-lg ${getRarityColor(badge.rarity)}`}>
                <div className="text-lg mb-1">{badge.icon}</div>
                <p className="text-xs font-medium truncate">{badge.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">まだバッジがありません</p>
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">連続日数</p>
            <p className="text-2xl font-bold text-orange-600">{user.streakDays}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Star className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>
            {user.lastWalkDate 
              ? `最終: ${user.lastWalkDate.toLocaleDateString('ja-JP')}`
              : '今日から始めましょう！'
            }
          </span>
        </div>
      </div>

      {/* Current Title */}
      {user.currentTitle && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">称号</span>
          </div>
          <p className="text-sm text-purple-700 mt-1">{user.currentTitle}</p>
        </div>
      )}
    </div>
  );
}