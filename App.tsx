
import React, { useState } from 'react';
import { AppScreen } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import LessonPlanGenerator from './components/LessonPlanGenerator';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.LOGIN);

  const navigateTo = (newScreen: AppScreen) => {
    setScreen(newScreen);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
      {screen === AppScreen.LOGIN && (
        <Login onLoginSuccess={() => navigateTo(AppScreen.DASHBOARD)} />
      )}
      
      {screen === AppScreen.DASHBOARD && (
        <Dashboard 
          onSair={() => navigateTo(AppScreen.LOGIN)}
          onAbrirCalendario={() => navigateTo(AppScreen.CALENDAR)}
          onAbrirGerador={() => navigateTo(AppScreen.LESSON_PLAN_GENERATOR)}
        />
      )}
      
      {screen === AppScreen.CALENDAR && (
        <CalendarView onVoltar={() => navigateTo(AppScreen.DASHBOARD)} />
      )}

      {screen === AppScreen.LESSON_PLAN_GENERATOR && (
        <LessonPlanGenerator onVoltar={() => navigateTo(AppScreen.DASHBOARD)} />
      )}
    </div>
  );
};

export default App;
