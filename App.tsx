
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HoroscopeView from './components/HoroscopeView';
import KundaliView from './components/KundaliView';
import MatchmakingView from './components/MatchmakingView';
import NumerologyView from './components/NumerologyView';
import PalmistryView from './components/PalmistryView';
import { Language } from './types';
import { StorageService } from './services/storageService';
import { getHoroscope } from './services/geminiService';
import { ZODIAC_SIGNS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('horoscope');
  const [language, setLanguage] = useState<Language>('English');

  // Background Update Logic for preferred sign
  useEffect(() => {
    const syncData = async () => {
      const prefSign = StorageService.getUserSign() || ZODIAC_SIGNS[0].name;
      try {
        await getHoroscope(prefSign, 'daily', language);
      } catch (e) {
        console.warn("Background sync failed", e);
      }
    };

    syncData();
  }, [language]);

  const renderContent = () => {
    switch (activeTab) {
      case 'horoscope':
        return <HoroscopeView language={language} />;
      case 'kundali':
        return <KundaliView language={language} />;
      case 'palmistry':
        return <PalmistryView language={language} />;
      case 'numerology':
        return <NumerologyView language={language} />;
      case 'matchmaking':
        return <MatchmakingView language={language} />;
      default:
        return <HoroscopeView language={language} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      language={language} 
      setLanguage={setLanguage}
    >
      <div className="max-w-5xl mx-auto">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
