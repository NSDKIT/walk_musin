import React, { useState } from 'react';
import { Music, Play, Pause, Heart, Download, Search, Filter, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function MusicLibrary() {
  const { state, addToFavorites, checkCompletedTracks } = useApp();
  const { tracks, favorites, error } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'duration'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'generating'>('all');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

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

  const handleLoadCompletedTracks = async () => {
    setIsLoadingTracks(true);
    try {
      await checkCompletedTracks();
    } catch (error) {
      console.error('Failed to load completed tracks:', error);
    } finally {
      setIsLoadingTracks(false);
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
      case 'generating': return 'text-purple-600 bg-purple-100';
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

  const generatingTracks = tracks.filter(track => track.status === 'generating').length;
  const completedTracks = tracks.filter(track => track.status === 'completed').length;
  const failedTracks = tracks.filter(track => track.status === 'failed').length;

  // Empty state with load button
  if (tracks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Load Button - Even in Empty State */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">音楽ライブラリ</h1>
              <p className="text-gray-600">あなたの歩行データから生成された楽曲コレクション</p>
            </div>
            
            {/* Load Button - Always Visible */}
            <button
              onClick={handleLoadCompletedTracks}
              disabled={isLoadingTracks}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white rounded-xl font-bold hover:from-teal-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingTracks ? 'animate-spin' : ''}`} />
              <span>{isLoadingTracks ? '読み込み中...' : '楽曲読み込み'}</span>
            </button>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">エラーが発生しました</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State Content */}
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">まだ楽曲がありません</h2>
            <p className="text-gray-500 mb-8">ウォーキングを開始して、あなただけの音楽を生成しましょう！</p>
            
            {/* Additional Load Button in Empty State */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-md mx-auto">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-blue-900">楽曲を確認</h3>
                  <p className="text-sm text-blue-700">生成済みの楽曲があるかチェックします</p>
                </div>
              </div>
              <button
                onClick={handleLoadCompletedTracks}
                disabled={isLoadingTracks}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoadingTracks ? '確認中...' : '楽曲を読み込む'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Load Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">音楽ライブラリ</h1>
            <p className="text-gray-600">あなたの歩行データから生成された楽曲コレクション</p>
          </div>
          
          {/* Main Load Button - Always Visible */}
          <button
            onClick={handleLoadCompletedTracks}
            disabled={isLoadingTracks}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white rounded-xl font-bold hover:from-teal-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
          >
            <RefreshCw className={`w-5 h-5 ${isLoadingTracks ? 'animate-spin' : ''}`} />
            <span>{isLoadingTracks ? '読み込み中...' : '楽曲読み込み'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">エラーが発生しました</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generating Tracks Notification */}
        {generatingTracks > 0 && (
          <div className="mb-8 bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">生成中の楽曲があります</h3>
                  <p className="text-sm text-purple-700">
                    {generatingTracks}曲が生成中です。「楽曲読み込み」ボタンで完了した楽曲を確認できます。
                  </p>
                </div>
              </div>
              <button
                onClick={handleLoadCompletedTracks}
                disabled={isLoadingTracks}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingTracks ? 'animate-spin' : ''}`} />
                <span>{isLoadingTracks ? '確認中' : '今すぐ確認'}</span>
              </button>
            </div>
          </div>
        )}

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-2xl font-bold text-green-600">{completedTracks}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">生成中</p>
                <p className="text-2xl font-bold text-purple-600">{generatingTracks}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">お気に入り</p>
                <p className="text-2xl font-bold text-pink-600">{favorites.length}</p>
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
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                      <span className="text-sm text-purple-600">生成中...</span>
                    </div>
                  )}

                  {track.status === 'failed' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-xs">✗</span>
                      </div>
                      <span className="text-sm text-red-600">失敗</span>
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
                        <p className="font-medium text-gray-900">{track.environmentData?.timeOfDay || '不明'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">天気</span>
                        <p className="font-medium text-gray-900">{track.environmentData?.weather.description || '不明'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">場所</span>
                        <p className="font-medium text-gray-900">{track.environmentData?.location.name || '不明'}</p>
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