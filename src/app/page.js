"use client";

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import TrendOverviewView from '../components/TrendOverviewView';
import TrendingView from '../components/TrendingView';
import EducationView from '../components/EducationView';
import CompetitorsView from '../components/CompetitorsView';
import SettingsView from '../components/SettingsView';

export default function Home() {
  const [activeTab, setActiveTab] = useState('trend-overview'); // Set default to overview to meet user's requirement
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'trend-overview':
        return <TrendOverviewView />;
      case 'trending':
        return <TrendingView />;
      case 'education':
        return <EducationView />;
      case 'competitors':
        return <CompetitorsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <TrendOverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans w-full">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Content Area */}
      <main className="flex-grow md:pl-64 min-h-screen w-full transition-all duration-300">
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 pt-20 md:pt-8">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
