import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { Dashboard } from './components/Dashboard';
import { MusicLibrary } from './components/MusicLibrary';
import { UserProfile } from './components/UserProfile';
import { Navigation } from './components/Navigation';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'library':
        return <MusicLibrary />;
      case 'achievements':
        return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
          <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">実績・バッジ</h2>
            <p className="text-gray-500">実績システムは開発中です</p>
          </div>
        </div>;
      case 'profile':
        return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
          <div className="max-w-2xl mx-auto">
            <UserProfile />
          </div>
        </div>;
      case 'settings':
        return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
          <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">設定</h2>
            <p className="text-gray-500">設定画面は開発中です</p>
          </div>
        </div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="pb-20"> {/* Add padding for bottom navigation */}
      {renderCurrentView()}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;