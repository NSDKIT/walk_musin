import React, { useState, useEffect } from 'react';
import { Music, MapPin, Trophy, Zap, Clock, TrendingUp, Database, LogOut, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WalkingTracker } from './WalkingTracker';
import { UserProfile } from './UserProfile';
import { AuthModal } from './AuthModal';
import { weatherApi } from '../services/weatherApi';
import { isSupabaseConfigured } from '../lib/supabase';

export function Dashboard() {
  const { state, signOut, clearError, checkCompletedTracks } = useApp();
  const { user, isWalking, tracks, isAuthenticated, error } = state;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckingTracks, setIsCheckingTracks] = useState(false);
  const [weatherData, setWeatherData] = useState({
    condition: 'clear',
    temperature: 22,
    humidity: 60,
    windSpeed: 5,
    description: '晴れ',
    icon: '01d',
  });

  const recentTracks = tracks.slice(0, 3);
  const completedTracks = tracks.filter(track => track.status === 'completed').length;
  const generatingTracks = tracks.filter(track => track.status === 'generating').length;
  const totalDistance = Math.round(user.totalDistance / 1000 * 10) / 10; // km with 1 decimal

  // Get current location and weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const weather = await weatherApi.getCurrentWeather(
              position.coords.latitude,
              position.coords.longitude
            );
            setWeatherData(weather);
          } catch (error) {
            console.warn('Failed to fetch weather data:', error);
          }
        },
        (error) => {
          console.warn('Failed to get location for weather:', error);
        }
      );
    }
  }, []);

  const getWeatherRecommendation = (condition: string, temperature: number) => {
    if (condition === 'rain') {
      return { message: '雨の日は室内運動がおすすめです', color: 'text-blue-700', bg: 'bg-blue-50' };
    }
    if (temperature > 30) {
      return { message: '暑いので水分補給を忘れずに！', color: 'text-red-700', bg: 'bg-red-50' };
    }
    if (temperature < 5) {
      return { message: '寒いので防寒対策をしっかりと', color: 'text-blue-700', bg: 'bg-blue-50' };
    }
    return { message: 'ウォーキングに最適な天気です！', color: 'text-green-700', bg: 'bg-green-50' };
  };

  const recommendation = getWeatherRecommendation(weatherData.condition, weatherData.temperature);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCheckCompletedTracks = async () => {
    setIsCheckingTracks(true);
    try {
      await checkCompletedTracks();
    } catch (error) {
      console.error('Failed to check completed tracks:', error);
    } finally {
      setIsCheckingTracks(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WalkTunes</h1>
                <p className="text-sm text-gray-500">AI Music for Your Journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Database Status */}
              <div className="flex items-center space-x-2">
                <Database className={`w-5 h-5 ${isSupabaseConfigured ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isSupabaseConfigured ? 'クラウド' : 'ローカル'}
                </span>
              </div>

              {/* Check Completed Tracks Button */}
              {generatingTracks > 0 && (
                <button
                  onClick={handleCheckCompletedTracks}
                  disabled={isCheckingTracks}
                  className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingTracks ? 'animate-spin' : ''}`} />
                  <span>楽曲確認</span>
                </button>
              )}

              {/* User Level */}
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Lv.{user.level}</span>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                    style={{ width: `${(user.xp % 100)}%` }}
                  />
                </div>
              </div>

              {/* Auth Controls */}
              {isSupabaseConfigured && (
                <div className="flex items-center space-x-2">
                  {isAuthenticated ? (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ログアウト</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                    >
                      ログイン
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Notification */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">エラーが発生しました</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Generating Tracks Notification */}
        {generatingTracks > 0 && (
          <div className="mb-8 bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-purple-900">音楽生成中</h3>
                <p className="text-sm text-purple-700">
                  {generatingTracks}曲の音楽を生成中です。完了まで数分かかる場合があります。
                </p>
              </div>
              <button
                onClick={handleCheckCompletedTracks}
                disabled={isCheckingTracks}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isCheckingTracks ? '確認中...' : '今すぐ確認'}
              </button>
            </div>
          </div>
        )}

        {/* Supabase Connection Notice */}
        {isSupabaseConfigured && !isAuthenticated && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">クラウド同期が利用可能です</h3>
                <p className="text-sm text-blue-700">ログインすると、楽曲データがクラウドに保存され、デバイス間で同期されます。</p>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ログイン
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総距離</p>
                <p className="text-2xl font-bold text-gray-900">{totalDistance}km</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">生成楽曲</p>
                <p className="text-2xl font-bold text-gray-900">{completedTracks}</p>
                {generatingTracks > 0 && (
                  <p className="text-xs text-purple-600">+{generatingTracks} 生成中</p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ウォーキング回数</p>
                <p className="text-2xl font-bold text-gray-900">{user.totalWalks}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総時間</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(user.totalDuration / 3600)}h {Math.floor((user.totalDuration % 3600) / 60)}m
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Walking Tracker */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">ウォーキングトラッカー</h2>
              <WalkingTracker />
            </div>

            {/* Recent Tracks */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">最近の楽曲</h2>
                <button className="text-teal-600 hover:text-teal-700 font-medium">
                  すべて見る →
                </button>
              </div>
              
              {recentTracks.length > 0 ? (
                <div className="space-y-4">
                  {recentTracks.map((track) => (
                    <div key={track.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-purple-600 rounded-lg flex items-center justify-center">
                        {track.imageUrl ? (
                          <img src={track.imageUrl} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Music className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{track.title}</p>
                        <p className="text-sm text-gray-500">
                          {track.genre} • {track.bpm} BPM • {track.status === 'completed' ? '完了' : track.status === 'generating' ? '生成中' : '失敗'}
                        </p>
                      </div>
                      {track.status === 'generating' && (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                          <span className="text-sm text-purple-600">生成中...</span>
                        </div>
                      )}
                      {track.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">完了</span>
                        </div>
                      )}
                      {track.status === 'failed' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-red-500">失敗</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">まだ楽曲がありません</p>
                  <p className="text-sm text-gray-400">ウォーキングを開始して音楽を生成しましょう！</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* User Profile */}
            <UserProfile />

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">クイックアクション</h3>
              <div className="space-y-3">
                <button 
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                    isWalking 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}
                >
                  {isWalking ? 'ウォーキング停止' : 'ウォーキング開始'}
                </button>
                
                <button className="w-full px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors">
                  音楽ライブラリ
                </button>
                
                <button className="w-full px-4 py-3 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors">
                  実績・バッジ
                </button>

                {generatingTracks > 0 && (
                  <button 
                    onClick={handleCheckCompletedTracks}
                    disabled={isCheckingTracks}
                    className="w-full px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                  >
                    {isCheckingTracks ? '確認中...' : '楽曲完了確認'}
                  </button>
                )}
              </div>
            </div>

            {/* Weather Widget */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">天気情報</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{weatherApi.getWeatherEmoji(weatherData.condition)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{weatherData.description}</p>
                  <p className="text-sm text-gray-500">{weatherData.temperature}°C • 湿度 {weatherData.humidity}%</p>
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg ${recommendation.bg}`}>
                <p className={`text-sm font-medium ${recommendation.color}`}>{recommendation.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}