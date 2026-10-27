/**
 * Project ORBIT - Main Application Entrypoint
 * Unifies BMO, HQ Strategic, Panelist, Assignments, and CFM perspectives
 */

import React, { useState } from 'react';
import { AppProvider, useOrbit } from './state/context';
import { Banner } from './components/Banner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ExperienceCatalogDrawer } from './components/ExperienceCatalogDrawer';
import { DemoGuideDrawer } from './components/DemoGuideDrawer';

// Views
import { ViewCommandCenter } from './views/ViewCommandCenter';
import { ViewCandidateQueue } from './views/ViewCandidateQueue';
import { ViewPanelReview } from './views/ViewPanelReview';
import { ViewHeliosCommand } from './views/ViewHeliosCommand';
import { ViewScoringAudit } from './views/ViewScoringAudit';
import { ViewMatchLab } from './views/ViewMatchLab';
import { ViewCrossAnalytics } from './views/ViewCrossAnalytics';
import { ViewCareerPlanner } from './views/ViewCareerPlanner';
import { ViewOpsRegisters } from './views/ViewOpsRegisters';
import { ViewDeltaLedger } from './views/ViewDeltaLedger';
import { ViewBoardDetail } from './views/ViewBoardDetail';

const OrbitAppContent: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [demoGuideOpen, setDemoGuideOpen] = useState(false);

  const handleNavigate = (viewId: string) => {
    dispatch({ type: 'SET_VIEW', viewId });
  };

  const renderActiveView = () => {
    switch (state.activeViewId) {
      case 'VIEW-CommandCenter':
        return <ViewCommandCenter />;
      case 'VIEW-CandidateQueue':
        return <ViewCandidateQueue />;
      case 'VIEW-PanelReview':
        return <ViewPanelReview />;
      case 'VIEW-HeliosCommand':
        return <ViewHeliosCommand />;
      case 'VIEW-ScoringAudit':
        return <ViewScoringAudit />;
      case 'VIEW-MatchLab':
        return <ViewMatchLab />;
      case 'VIEW-CrossAnalytics':
        return <ViewCrossAnalytics />;
      case 'VIEW-CareerPlanner':
        return <ViewCareerPlanner />;
      case 'VIEW-OpsRegisters':
        return <ViewOpsRegisters />;
      case 'VIEW-DeltaLedger':
        return <ViewDeltaLedger />;
      case 'VIEW-BoardDetail':
        return <ViewBoardDetail />;
      default:
        return <ViewCommandCenter />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05080f] text-slate-100 font-sans">
      <Banner />
      <Header
        onOpenCatalog={() => setCatalogOpen(true)}
        onOpenDemoGuide={() => setDemoGuideOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
        {renderActiveView()}
      </main>

      <Footer />

      {/* Drawers */}
      <ExperienceCatalogDrawer
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onNavigate={handleNavigate}
      />

      <DemoGuideDrawer
        open={demoGuideOpen}
        onClose={() => setDemoGuideOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <OrbitAppContent />
    </AppProvider>
  );
}
