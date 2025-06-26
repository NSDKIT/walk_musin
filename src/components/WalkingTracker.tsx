import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, MapPin, Clock, Zap, Target } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useWalkingTracker } from '../hooks/useWalkingTracker';

export function WalkingTracker() {
  const { state, startWalk, stopWalk, generateMusic } = useApp();
  const { 
    walkData, 
    isWalking, 
    isTracking, 
    error, 
    startWalk: startTracking, 
    stopWalk: stopTracking,
    pauseWalk,
    resumeWalk,
    location 
  } = useWalkingTracker();

  const [isPaused, setIsPaused] = useState(false);

  const handleStartWalk = () => {
    startWalk();
    startTracking();
  };

  const handleStopWalk = () => {
    const finalWalkData = stopTracking();
    if (finalWalkData) {
      stopWalk();
      if (state.settings.autoGenerate) {
        // Pass location data for weather API
        const locationData = location ? {
          lat: location.latitude,
          lon: location.longitude
        } : undefined;
        generateMusic(finalWalkData, locationData);
      }
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeWalk();
      setIsPaused(false);
    } else {
      pauseWalk();
      setIsPaused(true);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const formatSpeed = (kmh: number) => {
    return `${kmh.toFixed(1)} km/h`;
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 font-medium">位置情報エラー</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button 
          onClick={handleStartWalk}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!isWalking && !walkData) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Play className="w-10 h-10 text-white ml-1" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">ウォーキングを始めましょう</h3>
        <p className="text-gray-500 mb-6">位置情報を使って歩行データを記録し、<br />Suno AIであなただけの音楽を生成します</p>
        
        <button
          onClick={handleStartWalk}
          className="px-8 py-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white rounded-2xl font-bold hover:from-teal-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
        >
          ウォーキング開始
        </button>
        
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">GPS追跡</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">AI音楽生成</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">データ分析</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      {walkData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">経過時間</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(walkData.duration)}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">距離</span>
            </div>
            <p className="text-2xl font-bold">{formatDistance(walkData.distance)}</p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">現在速度</span>
            </div>
            <p className="text-2xl font-bold">{formatSpeed(walkData.speed)}</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">平均速度</span>
            </div>
            <p className="text-2xl font-bold">{formatSpeed(walkData.avgSpeed)}</p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4">
        {isWalking && (
          <button
            onClick={handlePauseResume}
            className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
              isPaused
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5 inline mr-2" />
                再開
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 inline mr-2" />
                一時停止
              </>
            )}
          </button>
        )}

        <button
          onClick={isWalking ? handleStopWalk : handleStartWalk}
          className={`px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            isWalking
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-teal-500 to-purple-600 text-white hover:from-teal-600 hover:to-purple-700'
          }`}
        >
          {isWalking ? (
            <>
              <Square className="w-5 h-5 inline mr-2" />
              ウォーキング終了
            </>
          ) : (
            <>
              <Play className="w-5 h-5 inline mr-2 ml-1" />
              ウォーキング開始
            </>
          )}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-600">
          {isTracking ? 'GPS追跡中' : 'GPS待機中'}
        </span>
        {location && (
          <span className="text-xs text-gray-400">
            (精度: {Math.round(location.accuracy)}m)
          </span>
        )}
      </div>

      {/* Additional Stats */}
      {walkData && walkData.duration > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">詳細データ</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">推定歩数</span>
              <p className="font-medium text-gray-900">{walkData.steps.toLocaleString()} 歩</p>
            </div>
            <div>
              <span className="text-gray-500">消費カロリー</span>
              <p className="font-medium text-gray-900">{walkData.calories} kcal</p>
            </div>
            <div>
              <span className="text-gray-500">最高速度</span>
              <p className="font-medium text-gray-900">{formatSpeed(walkData.maxSpeed)}</p>
            </div>
            <div>
              <span className="text-gray-500">記録ポイント</span>
              <p className="font-medium text-gray-900">{walkData.positions.length} 点</p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-generate notification */}
      {state.settings.autoGenerate && walkData && walkData.duration > 300 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-900">自動音楽生成が有効です</p>
              <p className="text-sm text-purple-700">ウォーキング終了時にSuno AIで楽曲を自動生成します</p>
            </div>
          </div>
        </div>
      )}

      {/* API Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">Suno AI連携が有効です</p>
            <p className="text-sm text-blue-700">Suno AI と OpenWeatherMap API を使用して高品質な音楽生成と天気情報を取得します</p>
          </div>
        </div>
      </div>
    </div>
  );
}