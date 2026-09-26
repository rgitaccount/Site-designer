import React, { useState, useEffect, useCallback } from 'react';
import { 
  RoofPlane, 
  PanelPlacement, 
  Obstacle, 
  ActiveTool, 
  WorkflowStep, 
  MetricPoint, 
  PANEL_MODELS,
  DEFAULT_PANEL_MODEL 
} from './types/solar';
import { 
  INITIAL_PROJECT, 
  INITIAL_ROOFS, 
  INITIAL_OBSTACLES, 
  createInitialPanels 
} from './data/initialData';
import { generatePanelsForRoof } from './utils/geometry';
import { TopNav } from './components/TopNav';
import { LeftToolbar } from './components/LeftToolbar';
import { SatelliteMap } from './components/SatelliteMap';
import { RightInspector } from './components/RightInspector';
import { SystemTab } from './components/SystemTab';
import { ProductionTab } from './components/ProductionTab';
import { PricingTab } from './components/PricingTab';
import { ProposalTab } from './components/ProposalTab';
import { PreviewModal } from './components/PreviewModal';

export default function App() {
  // 1. Core State
  const [project, setProject] = useState(INITIAL_PROJECT);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('designer');
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

  // Roof planes & Panels (Source of truth is placed panel objects)
  const [roofs, setRoofs] = useState<RoofPlane[]>(INITIAL_ROOFS);
  const [panels, setPanels] = useState<PanelPlacement[]>(createInitialPanels);
  const [obstacles, setObstacles] = useState<Obstacle[]>(INITIAL_OBSTACLES);

  // Selections
  const [selectedRoofId, setSelectedRoofId] = useState<string | null>('roof-a');
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);

  // Modals & Notifications
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // LIVE DERIVED TOTALS: Strictly calculated from actual placed panel objects
  const totalPanelsCount = panels.length;
  const totalCapacityKwp = panels.reduce((sum, p) => sum + p.powerWatts, 0) / 1000;

  // 2. Handlers for Roofs
  const handleSelectRoof = (id: string | null) => {
    setSelectedRoofId(id);
    if (id) {
      setSelectedPanelIds((prev) =>
        prev.filter((pId) => {
          const p = panels.find((pan) => pan.id === pId);
          return p && p.roofId === id;
        })
      );
    }
  };

  const handleUpdateRoof = (id: string, updates: Partial<RoofPlane>) => {
    setRoofs((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };

        // If panel model changed, update power rating on existing panels of that roof
        if (updates.panelPowerWatts !== undefined && updates.panelPowerWatts !== r.panelPowerWatts) {
          setPanels((prevPanels) =>
            prevPanels.map((p) =>
              p.roofId === id ? { ...p, powerWatts: updates.panelPowerWatts! } : p
            )
          );
        }
        return updated;
      })
    );
  };

  const handleUpdateRoofPointsM = (id: string, newPointsM: MetricPoint[]) => {
    handleUpdateRoof(id, { polygonM: newPointsM });
  };

  const handleDeleteRoof = (id: string) => {
    setRoofs((prev) => prev.filter((r) => r.id !== id));
    // Remove all panels associated with this roof plane
    setPanels((prev) => prev.filter((p) => p.roofId !== id));
    setSelectedPanelIds([]);
    if (selectedRoofId === id) {
      const remaining = roofs.filter((r) => r.id !== id);
      setSelectedRoofId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleCreateNewRoofM = (pointsM: MetricPoint[]) => {
    const letters = ['C', 'D', 'E', 'F', 'G', 'H'];
    const letter = letters[Math.min(roofs.length, letters.length - 1)] || `${roofs.length + 1}`;
    const colors = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    const color = colors[roofs.length % colors.length];

    const newRoof: RoofPlane = {
      id: `roof-${Date.now()}`,
      name: `Roof ${letter}`,
      color,
      polygonM: pointsM,
      azimuthDeg: 180, // Physical slope orientation default: South
      tiltDeg: 20,
      edgeSetbackM: 0.50,
      panelModelId: DEFAULT_PANEL_MODEL.id,
      panelPowerWatts: DEFAULT_PANEL_MODEL.powerWatts,
      orientation: 'portrait',
      rowSpacingM: 0.35,
    };

    setRoofs((prev) => [...prev, newRoof]);
    setSelectedRoofId(newRoof.id);
    setActiveTool('select');
  };

  // 3. Handlers for Panels (Fill with panels, Delete, Rotate, Add)
  const handleFillWithPanels = (roofId: string) => {
    const roof = roofs.find((r) => r.id === roofId);
    if (!roof) return;

    const model = PANEL_MODELS.find((m) => m.id === roof.panelModelId) || DEFAULT_PANEL_MODEL;

    // Generate metric panel placements inside roof polygon with setback
    const newPanels = generatePanelsForRoof(
      roof.id,
      roof.polygonM,
      model,
      roof.orientation,
      roof.edgeSetbackM,
      0, // Visual panel arrangement relative to building grid
      obstacles.filter((obs) => obs.roofId === roof.id || !obs.roofId)
    );

    // Replace existing panels of this roof
    setPanels((prev) => [...prev.filter((p) => p.roofId !== roofId), ...newPanels]);
    setSelectedPanelIds([]);
  };

  const handleClearRoofPanels = (roofId: string) => {
    setPanels((prev) => prev.filter((p) => p.roofId !== roofId));
    setSelectedPanelIds([]);
  };

  const handleDeleteSelectedPanels = useCallback(() => {
    if (selectedPanelIds.length === 0) return;
    setPanels((prev) => prev.filter((p) => !selectedPanelIds.includes(p.id)));
    setSelectedPanelIds([]);
  }, [selectedPanelIds]);

  const handleRotateSelectedPanels = useCallback(() => {
    if (selectedPanelIds.length === 0) return;
    setPanels((prev) =>
      prev.map((p) => {
        if (!selectedPanelIds.includes(p.id)) return p;
        const newRot = (p.rotationDeg + 90) % 360;
        const newOrient = p.orientation === 'portrait' ? 'landscape' : 'portrait';
        return {
          ...p,
          rotationDeg: newRot,
          orientation: newOrient,
        };
      })
    );
  }, [selectedPanelIds]);

  const handleAddSinglePanel = (roofId: string) => {
    const roof = roofs.find((r) => r.id === roofId);
    if (!roof) return;

    const avgX = roof.polygonM.reduce((s, pt) => s + pt.x, 0) / roof.polygonM.length;
    const avgY = roof.polygonM.reduce((s, pt) => s + pt.y, 0) / roof.polygonM.length;
    const model = PANEL_MODELS.find((m) => m.id === roof.panelModelId) || DEFAULT_PANEL_MODEL;

    const newPanel: PanelPlacement = {
      id: `p-single-${Date.now()}`,
      roofId: roof.id,
      xM: Math.round((avgX + (Math.random() * 2 - 1)) * 100) / 100,
      yM: Math.round((avgY + (Math.random() * 2 - 1)) * 100) / 100,
      rotationDeg: 0,
      orientation: roof.orientation,
      panelModelId: model.id,
      powerWatts: model.powerWatts,
      row: 0,
      col: 0,
    };

    setPanels((prev) => [...prev, newPanel]);
    setSelectedPanelIds([newPanel.id]);
  };

  // Keyboard Shortcuts: Delete/Backspace, Esc, Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPanelIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedPanels();
        }
      } else if (e.key === 'Escape') {
        setSelectedPanelIds([]);
        setActiveTool('select');
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedPanelIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setPanels((prev) =>
          prev.map((p) => {
            if (selectedPanelIds.includes(p.id)) {
              return {
                ...p,
                xM: Math.round((p.xM + dx) * 100) / 100,
                yM: Math.round((p.yM + dy) * 100) / 100,
              };
            }
            return p;
          })
        );
      } else if (e.key.toLowerCase() === 'r') {
        if (selectedPanelIds.length > 0) {
          e.preventDefault();
          handleRotateSelectedPanels();
        } else {
          setActiveTool('draw-roof');
        }
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('panels');
      } else if (e.key.toLowerCase() === 'o') {
        setActiveTool('obstacle');
      } else if (e.key.toLowerCase() === 'm') {
        setActiveTool('measure');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPanelIds, handleDeleteSelectedPanels]);

  // Save handler
  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Top Navigation Bar */}
      <TopNav
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        project={project}
        totalPanels={totalPanelsCount}
        totalCapacityKwp={totalCapacityKwp}
        onSave={handleSave}
        onPreview={() => setIsPreviewOpen(true)}
        isSaved={isSaved}
      />

      {/* 2. Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentStep === 'designer' && (
          <>
            {/* Left Vertical CAD Toolbar */}
            <LeftToolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              selectedPanelCount={selectedPanelIds.length}
              onDeleteSelectedPanels={handleDeleteSelectedPanels}
              onRotateSelectedPanels={handleRotateSelectedPanels}
              onAddPanelManual={() => selectedRoofId && handleAddSinglePanel(selectedRoofId)}
            />

            {/* Central Satellite Map Canvas */}
            <SatelliteMap
              roofs={roofs}
              selectedRoofId={selectedRoofId}
              onSelectRoof={handleSelectRoof}
              onUpdateRoofPointsM={handleUpdateRoofPointsM}
              onCreateRoofM={handleCreateNewRoofM}
              panels={panels}
              selectedPanelIds={selectedPanelIds}
              onSelectPanels={setSelectedPanelIds}
              onUpdatePanels={setPanels}
              obstacles={obstacles}
              onAddObstacle={(obs) => setObstacles((prev) => [...prev, obs])}
              activeTool={activeTool}
              onToolComplete={() => setActiveTool('select')}
              geoOrigin={project.geo}
            />

            {/* Right Contextual Properties & Live System Panel */}
            <RightInspector
              roofs={roofs}
              selectedRoofId={selectedRoofId}
              onSelectRoof={handleSelectRoof}
              onUpdateRoof={handleUpdateRoof}
              onDeleteRoof={handleDeleteRoof}
              onAddNewRoof={() => setActiveTool('draw-roof')}
              panels={panels}
              onFillWithPanels={handleFillWithPanels}
              onClearRoofPanels={handleClearRoofPanels}
              selectedPanelIds={selectedPanelIds}
              onDeleteSelectedPanels={handleDeleteSelectedPanels}
              onRotateSelectedPanels={handleRotateSelectedPanels}
              onAddSinglePanel={handleAddSinglePanel}
            />
          </>
        )}

        {currentStep === 'system' && (
          <SystemTab
            project={project}
            roofs={roofs}
            panels={panels}
            totalCapacityKwp={totalCapacityKwp}
          />
        )}

        {currentStep === 'production' && (
          <ProductionTab
            project={project}
            roofs={roofs}
            panels={panels}
            totalCapacityKwp={totalCapacityKwp}
          />
        )}

        {currentStep === 'pricing' && (
          <PricingTab
            project={project}
            panels={panels}
            totalCapacityKwp={totalCapacityKwp}
          />
        )}

        {currentStep === 'proposal' && (
          <ProposalTab
            project={project}
            roofs={roofs}
            panels={panels}
            totalCapacityKwp={totalCapacityKwp}
          />
        )}
      </div>

      {/* Engineering Drawing Sheet Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        project={project}
        roofs={roofs}
        panels={panels}
        totalCapacityKwp={totalCapacityKwp}
      />
    </div>
  );
}
