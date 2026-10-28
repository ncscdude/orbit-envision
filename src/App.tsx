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
import { AccessDenied } from './auth/AccessDenied';

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
import { ViewAccessAdmin } from './views/ViewAccessAdmin';
import { ViewPanelOversight } from './views/ViewPanelOversight';

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
      case 'VIEW-AccessAdmin':
        return <ViewAccessAdmin />;
      case 'VIEW-PanelOversight':
        return <ViewPanelOversight />;
      default:
        return <ViewCommandCenter />;
    }
  };

  // Identity with no ORBIT role: no navigation, no views.
  if (state.accessDenial) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05080f] text-slate-100 font-sans">
        <Banner />
        <main className="flex-1 p-4 sm:p-6">
          <AccessDenied
            actor={state.actorName}
            role="Unmapped"
            detail={
              state.accessDenial === 'UNMAPPED_ROLE'
                ? 'Your identity was recognized but has no ORBIT role. Contact the ORBIT role table approver.'
                : 'Your signed-in identity was not recognized by ORBIT.'
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05080f] text-slate-100 font-sans">
      <Banner />
      <Header
        onOpenCatalog={() => setCatalogOpen(true)}
        onOpenDemoGuide={() => setDemoGuideOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
        {state.currentRole === 'ORBIT Admin' && (
          <div className="max-w-7xl mx-auto mb-3 px-3 py-2 rounded border border-red-900/70 bg-red-950/30 text-xs text-red-200" role="note">
            Admin view: you can see everything and run logged repairs in Access Admin. Votes and board decisions are refused and logged.
          </div>
        )}
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
