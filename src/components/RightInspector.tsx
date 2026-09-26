import React from 'react';
import { 
  RoofPlane, 
  PanelPlacement, 
  PANEL_MODELS, 
  PanelModel 
} from '../types/solar';
import { calculatePolygonAreaM2 } from '../utils/geometry';
import { 
  Compass, 
  Trash2, 
  Grid3X3, 
  Plus, 
  Layers, 
  Zap, 
  Info,
  CheckCircle2,
  RotateCw
} from 'lucide-react';

interface RightInspectorProps {
  roofs: RoofPlane[];
  selectedRoofId: string | null;
  onSelectRoof: (id: string) => void;
  onUpdateRoof: (id: string, updates: Partial<RoofPlane>) => void;
  onDeleteRoof: (id: string) => void;
  onAddNewRoof: () => void;
  panels: PanelPlacement[];
  onFillWithPanels: (roofId: string) => void;
  onClearRoofPanels: (roofId: string) => void;
  selectedPanelIds: string[];
  onDeleteSelectedPanels: () => void;
  onRotateSelectedPanels: () => void;
  onAddSinglePanel: (roofId: string) => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  roofs,
  selectedRoofId,
  onSelectRoof,
  onUpdateRoof,
  onDeleteRoof,
  onAddNewRoof,
  panels,
  onFillWithPanels,
  onClearRoofPanels,
  selectedPanelIds,
  onDeleteSelectedPanels,
  onRotateSelectedPanels,
  onAddSinglePanel,
}) => {
  const selectedRoof = roofs.find((r) => r.id === selectedRoofId) || roofs[0] || null;

  // SOURCE OF TRUTH: Count and capacity derived strictly from actual placed panels
  const getRoofPanels = (roofId: string) => panels.filter((p) => p.roofId === roofId);

  const totalPanelCount = panels.length;
  const totalCapacityKwp = panels.reduce((sum, p) => sum + p.powerWatts, 0) / 1000;

  // Selected roof metrics
  const selectedRoofPanels = selectedRoof ? getRoofPanels(selectedRoof.id) : [];
  const selectedRoofCount = selectedRoofPanels.length;
  const selectedRoofKwp = selectedRoofPanels.reduce((sum, p) => sum + p.powerWatts, 0) / 1000;

  // Module dimensions from panel model definition (not hardcoded into renderer)
  const currentPanelModel: PanelModel = 
    PANEL_MODELS.find((m) => m.id === selectedRoof?.panelModelId) || PANEL_MODELS[0];

  // Geometric area calculations in square metres
  const roofAreaM2 = selectedRoof ? calculatePolygonAreaM2(selectedRoof.polygonM) : 0;
  const singlePanelAreaM2 = currentPanelModel.widthM * currentPanelModel.heightM;
  const panelCoveredAreaM2 = Math.round(selectedRoofCount * singlePanelAreaM2 * 10) / 10;
  const utilizationPercent = roofAreaM2 > 0 
    ? Math.min(100, Math.round((panelCoveredAreaM2 / roofAreaM2) * 100)) 
    : 0;

  // Selected panel specific count
  const selectedPanels = panels.filter((p) => selectedPanelIds.includes(p.id));
  const selectedPanelsKwp = selectedPanels.reduce((sum, p) => sum + p.powerWatts, 0) / 1000;

  // Cardinal direction helper for roof physical azimuth
  const getAzimuthLabel = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto select-none shrink-0 z-20 text-slate-800 text-xs">
      {/* 1. Header & SITE Summary List */}
      <div className="p-3.5 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 tracking-tight text-xs uppercase text-slate-500">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Site</span>
          </div>
          <button
            onClick={onAddNewRoof}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Roof</span>
          </button>
        </div>

        {/* Roof list */}
        <div className="space-y-1.5">
          {roofs.map((roof) => {
            const rPanels = getRoofPanels(roof.id);
            const rKwp = rPanels.reduce((sum, p) => sum + p.powerWatts, 0) / 1000;
            const isSelected = selectedRoof?.id === roof.id;

            return (
              <div
                key={roof.id}
                onClick={() => onSelectRoof(roof.id)}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: roof.color }}
                  />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                      <span>{roof.name}</span>
                      {isSelected && <span className="text-[10px] text-blue-600 font-normal">· Active</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span>{roof.azimuthDeg}° / {roof.tiltDeg}°</span>
                      <span className="mx-1">·</span>
                      <span className="font-mono">{getAzimuthLabel(roof.azimuthDeg)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900 tabular-nums">
                    {rPanels.length} <span className="text-[10px] font-normal text-slate-500">panels</span>
                  </div>
                  <div className="font-mono text-blue-600 text-[11px] font-medium tabular-nums">
                    {rKwp.toFixed(2)} kWp
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Aggregation (Derived strictly from placed panels sum) */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between px-1">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Total</span>
          <div className="text-right">
            <span className="font-mono font-bold text-slate-900 tabular-nums text-xs">
              {totalPanelCount} <span className="font-normal text-slate-500 text-[10px]">panels</span>
            </span>
            <span className="mx-1.5 text-slate-300">|</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums text-xs">
              {totalCapacityKwp.toFixed(2)} kWp
            </span>
          </div>
        </div>
      </div>

      {/* 2. Selection Action Alert (if specific panels are selected on canvas) */}
      {selectedPanelIds.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-900 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{selectedPanelIds.length} panel{selectedPanelIds.length > 1 ? 's' : ''} selected</span>
            </span>
            <span className="font-mono text-amber-900 font-semibold tabular-nums">
              {selectedPanelsKwp.toFixed(3)} kWp
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onRotateSelectedPanels}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 rounded text-amber-900 font-medium transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Rotate 90°</span>
            </button>
            <button
              onClick={onDeleteSelectedPanels}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete ({selectedPanelIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Selected Roof Properties Panel */}
      {selectedRoof ? (
        <div className="p-3.5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedRoof.color }}
              />
              <span className="font-semibold text-slate-900 text-xs">Roof Area</span>
            </div>
            <button
              onClick={() => onDeleteRoof(selectedRoof.id)}
              className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
              title="Delete roof plane"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Roof Name */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={selectedRoof.name}
              onChange={(e) => onUpdateRoof(selectedRoof.id, { name: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Physical Roof Azimuth (Physical slope orientation) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                <Compass className="w-3 h-3 text-slate-500" />
                <span>Azimuth</span>
              </label>
              <span className="font-mono text-slate-900 font-semibold tabular-nums">
                {selectedRoof.azimuthDeg}° ({getAzimuthLabel(selectedRoof.azimuthDeg)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={selectedRoof.azimuthDeg}
                onChange={(e) => onUpdateRoof(selectedRoof.id, { azimuthDeg: Number(e.target.value) })}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="360"
                value={selectedRoof.azimuthDeg}
                onChange={(e) => onUpdateRoof(selectedRoof.id, { azimuthDeg: Number(e.target.value) % 361 })}
                className="w-14 px-1.5 py-1 text-center font-mono border border-slate-200 rounded text-slate-900 font-semibold"
              />
            </div>

            {/* Quick azimuth preset buttons */}
            <div className="flex items-center gap-1 mt-1.5">
              {[
                { label: 'S (180°)', val: 180 },
                { label: 'SE (135°)', val: 135 },
                { label: 'SW (225°)', val: 225 },
                { label: 'W (270°)', val: 270 },
                { label: 'E (90°)', val: 90 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onUpdateRoof(selectedRoof.id, { azimuthDeg: preset.val })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    selectedRoof.azimuthDeg === preset.val
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Roof Inclination (Tilt) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600">Inclination</label>
              <span className="font-mono text-slate-900 font-semibold tabular-nums">
                {selectedRoof.tiltDeg}°
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={selectedRoof.tiltDeg}
                onChange={(e) => onUpdateRoof(selectedRoof.id, { tiltDeg: Number(e.target.value) })}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="60"
                value={selectedRoof.tiltDeg}
                onChange={(e) => onUpdateRoof(selectedRoof.id, { tiltDeg: Number(e.target.value) })}
                className="w-14 px-1.5 py-1 text-center font-mono border border-slate-200 rounded text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Panel Orientation */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Panel orientation
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded">
              <button
                onClick={() => onUpdateRoof(selectedRoof.id, { orientation: 'portrait' })}
                className={`py-1.5 text-center font-medium rounded transition-colors cursor-pointer ${
                  selectedRoof.orientation === 'portrait'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => onUpdateRoof(selectedRoof.id, { orientation: 'landscape' })}
                className={`py-1.5 text-center font-medium rounded transition-colors cursor-pointer ${
                  selectedRoof.orientation === 'landscape'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Edge Setback (in metres) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600">Edge setback</label>
              <span className="font-mono text-slate-900 font-semibold tabular-nums">
                {selectedRoof.edgeSetbackM.toFixed(2)} m
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={selectedRoof.edgeSetbackM}
                onChange={(e) => onUpdateRoof(selectedRoof.id, { edgeSetbackM: Number(e.target.value) })}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-slate-500 w-12 text-right">
                {(selectedRoof.edgeSetbackM * 100).toFixed(0)} cm
              </span>
            </div>
          </div>

          {/* Panel Model Selection */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Panel</label>
            <select
              value={selectedRoof.panelModelId}
              onChange={(e) => {
                const modelId = e.target.value;
                const m = PANEL_MODELS.find((mod) => mod.id === modelId);
                onUpdateRoof(selectedRoof.id, {
                  panelModelId: modelId,
                  panelPowerWatts: m ? m.powerWatts : 625,
                });
              }}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-slate-900 bg-white font-medium focus:outline-none focus:border-blue-500"
            >
              {PANEL_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.brand} {model.model}
                </option>
              ))}
            </select>
          </div>

          {/* Panel Power & Dimensions Data (Associated with selected model) */}
          <div className="px-2.5 py-2 bg-slate-50 rounded border border-slate-200 space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-sans">Panel power</span>
              <span className="font-bold text-slate-900 text-xs tabular-nums">
                {currentPanelModel.powerWatts} W
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-sans">Dimensions</span>
              <span>{currentPanelModel.widthM.toFixed(3)} m × {currentPanelModel.heightM.toFixed(3)} m</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onFillWithPanels(selectedRoof.id)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Fill with panels</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddSinglePanel(selectedRoof.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Panel</span>
              </button>
              <button
                onClick={() => onClearRoofPanels(selectedRoof.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors cursor-pointer"
              >
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* 4. Live System Information (Derived purely from geometry & placed panels) */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 tracking-tight text-xs uppercase text-slate-500 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Live System Information</span>
            </div>

            <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-sans">{selectedRoof.name}</span>
                <span className="font-bold text-slate-900"></span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-sans">Panels</span>
                <span className="font-bold text-slate-900 tabular-nums">{selectedRoofCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-sans">Installed capacity</span>
                <span className="font-bold text-blue-600 tabular-nums">
                  {selectedRoofKwp.toFixed(2)} kWp
                </span>
              </div>

              <div className="h-px bg-slate-200 my-1" />

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Azimuth</span>
                <span className="text-slate-800 tabular-nums">{selectedRoof.azimuthDeg}°</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Tilt</span>
                <span className="text-slate-800 tabular-nums">{selectedRoof.tiltDeg}°</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Panel</span>
                <span className="text-slate-800 truncate max-w-[130px] font-sans" title={currentPanelModel.model}>
                  {currentPanelModel.brand} {currentPanelModel.powerWatts} W
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Roof area</span>
                <span className="text-slate-800 tabular-nums">{roofAreaM2.toFixed(1)} m²</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Panel area</span>
                <span className="text-slate-800 tabular-nums">{panelCoveredAreaM2.toFixed(1)} m²</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Utilization</span>
                <span className="font-bold text-emerald-600 tabular-nums">{utilizationPercent} %</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500">
          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs">No roof selected.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Draw a new roof polygon or select one from the list above.
          </p>
        </div>
      )}
    </aside>
  );
};
