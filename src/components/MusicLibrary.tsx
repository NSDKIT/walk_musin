import React, { useState } from 'react';
import { Music, Play, Pause, Heart, Download, Search, Filter, Clock, MapPin } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function MusicLibrary() {
  const { state, addToFavorites } = useApp();
  const { tracks, favorites } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'duration'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'generating'>('all');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  // Filter and sort tracks
  const filteredTracks = tracks
    .filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          track.genre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || track.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  const handlePlayPause = (trackId: string) => {
    if (playingTrack === trackId) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(trackId);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'generating': return '生成中';
      case 'failed': return '失敗';
      default: return '不明';
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">音楽ライブラリ</h2>
            <p className="text-gray-500 mb-8">まだ楽曲がありません</p>
            <p className="text-sm text-gray-400">ウォーキングを開始して、あなただけの音楽を生成しましょう！</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">音楽ライブラリ</h1>
          <p className="text-gray-600">あなたの歩行データから生成された楽曲コレクション</p>
        </div>

        {/* Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="楽曲を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="completed">完了</option>
                  <option value="generating">生成中</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="date">作成日時</option>
                <option value="title">タイトル</option>
                <option value="duration">長さ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総楽曲数</p>
                <p className="text-2xl font-bold text-gray-900">{tracks.length}</p>
              </div>
              <Music className="w-8 h-8 text-teal-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了済み</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tracks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">お気に入り</p>
                <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
              </div>
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-4">
          {filteredTracks.map((track) => (
            <div key={track.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-6">
                {/* Album Art / Placeholder */}
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  {track.imageUrl ? (
                    <img src={track.imageUrl} alt={track.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Music className="w-8 h-8 text-white" />
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{track.title}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>{track.genre}</span>
                    <span>•</span>
                    <span>{track.bpm} BPM</span>
                    <span>•</span>
                    <span>{track.duration}秒</span>
                    <span>•</span>
                    <span>{formatDate(track.createdAt)}</span>
                  </div>
                  
                  {/* Walking Data */}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{(track.walkingData.distance / 1000).toFixed(2)}km</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{Math.floor(track.walkingData.duration / 60)}分</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(track.status)}`}>
                    {getStatusText(track.status)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {track.status === 'completed' && (
                    <>
                      <button
                        onClick={() => handlePlayPause(track.id)}
                        className="w-10 h-10 bg-teal-100 hover:bg-teal-200 rounded-full flex items-center justify-center transition-colors"
                      >
                        {playingTrack === track.id ? (
                          <Pause className="w-5 h-5 text-teal-600" />
                        ) : (
                          <Play className="w-5 h-5 text-teal-600 ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => addToFavorites(track.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          favorites.includes(track.id)
                            ? 'bg-pink-100 hover:bg-pink-200'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Heart 
                          className={`w-5 h-5 ${
                            favorites.includes(track.id) 
                              ? 'text-pink-600 fill-current' 
                              : 'text-gray-600'
                          }`} 
                        />
                      </button>

                      <button className="w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
                        <Download className="w-5 h-5 text-purple-600" />
                      </button>
                    </>
                  )}

                  {track.status === 'generating' && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent"></div>
                      <span className="text-sm text-gray-500">生成中...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Info (if playing) */}
              {playingTrack === track.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">生成プロンプト</h4>
                    <p className="text-sm text-gray-600 mb-4">"{track.prompt}"</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ムード</span>
                        <p className="font-medium text-gray-900">{track.mood}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">時間帯</span>
                        <p className="font-medium text-gray-900">{track.environmentData.timeOfDay}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">天気</span>
                        <p className="font-medium text-gray-900">{track.environmentData.weather.description}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">場所</span>
                        <p className="font-medium text-gray-900">{track.environmentData.location.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">検索条件に一致する楽曲が見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
}