import React from 'react';
import { MapViewportState } from '../../types/map';
import { ActiveTool, GeoCoordinate } from '../../types/solar';
import { metricToGeo } from '../../utils/mapProjection';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  Crosshair, 
  Check, 
  X,
  Grid3X3,
  AlertTriangle
} from 'lucide-react';

interface MapControlsOverlayProps {
  viewport: MapViewportState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onResetBearing: () => void;
  mapMode: 'satellite' | 'cad';
  onToggleMapMode: (mode: 'satellite' | 'cad') => void;
  activeTool: ActiveTool;
  drawingVertexCount: number;
  onFinishDrawingRoof: () => void;
  onCancelDrawingRoof: () => void;
  onClearMeasurements: () => void;
  hasMeasurements: boolean;
  totalPanelsCount: number;
  totalCapacityKwp: number;
  geoOrigin: GeoCoordinate;
  validationWarning?: string | null;
}

/**
 * Map HUD Controls & Status Bar Overlay
 * Supports pan, zoom, scale, north arrow, and dynamic geographic coordinates.
 */
export const MapControlsOverlay: React.FC<MapControlsOverlayProps> = ({
  viewport,
  onZoomIn,
  onZoomOut,
  onResetView,
  onResetBearing,
  mapMode,
  onToggleMapMode,
  activeTool,
  drawingVertexCount,
  onFinishDrawingRoof,
  onCancelDrawingRoof,
  onClearMeasurements,
  hasMeasurements,
  totalPanelsCount,
  totalCapacityKwp,
  geoOrigin,
  validationWarning,
}) => {
  // Compute live geographic coordinates at the current center of the viewport
  const currentCenterGeo = metricToGeo(viewport.centerMetric, geoOrigin);

  // Dynamic Scale Bar:
  // Choose scale step (5m, 10m, or 20m) so bar is approximately 100px - 200px wide
  const targetPixels = 160;
  let scaleMeters = 10;
  if (scaleMeters * viewport.pixelsPerMeter < 80) scaleMeters = 20;
  if (scaleMeters * viewport.pixelsPerMeter > 260) scaleMeters = 5;
  const scaleBarWidthPx = Math.round(scaleMeters * viewport.pixelsPerMeter);

  return (
    <>
      {/* 1. Floating Tool Guidance Banner */}
      {activeTool === 'draw-roof' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 px-4 py-2 rounded-md shadow-lg flex items-center gap-3 z-40 text-xs">
          <Crosshair className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>
            {drawingVertexCount === 0
              ? 'Click anywhere on the roof to start polygon'
              : `${drawingVertexCount} vertices placed. Click near start point to close roof.`}
          </span>
          {drawingVertexCount >= 3 && (
            <button
              onClick={onFinishDrawingRoof}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded text-white font-medium cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Close Roof</span>
            </button>
          )}
          <button
            onClick={onCancelDrawingRoof}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {activeTool === 'measure' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-700 px-4 py-2 rounded-md shadow-lg flex items-center gap-3 z-40 text-xs">
          <span className="text-amber-400 font-mono font-medium">MEASURE TOOL:</span>
          <span>Click two points on the roof to measure distance in metres.</span>
          {hasMeasurements && (
            <button
              onClick={onClearMeasurements}
              className="text-slate-400 hover:text-white underline cursor-pointer ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {activeTool === 'panels' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 px-4 py-2 rounded-md shadow-lg flex items-center gap-2.5 z-40 text-xs">
          <Grid3X3 className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Click anywhere on a roof to place a module at that exact metric coordinate.</span>
        </div>
      )}

      {/* Subtle Visual Indication for Invalid Placement/Drag/Rotation */}
      {validationWarning && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-rose-950/90 backdrop-blur-xs text-rose-200 border border-rose-600/80 px-4 py-2 rounded-md shadow-2xl flex items-center gap-2 z-50 text-xs transition-all duration-200 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{validationWarning}</span>
        </div>
      )}

      {/* 2. Bottom Controls & Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none select-none z-30">
        {/* Left: Zoom Controls & Map View Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/85 backdrop-blur-xs p-1 rounded-md border border-slate-800 text-white shadow-md">
          <button
            onClick={onZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-slate-300 w-12 text-center tabular-nums">
            {Math.round((viewport.pixelsPerMeter / 16) * 100)}%
          </span>
          <button
            onClick={onZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Satellite / Blueprint CAD Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded text-[11px]">
            <button
              onClick={() => onToggleMapMode('satellite')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                mapMode === 'satellite' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => onToggleMapMode('cad')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                mapMode === 'cad' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blueprint CAD
            </button>
          </div>
        </div>

        {/* Center: Dynamic Calibrated Metric Scale Bar & True North Indicator */}
        <div className="flex items-center gap-4 bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-md border border-slate-800 text-white shadow-md pointer-events-auto">
          {/* North Arrow with Bearing Reset */}
          <button
            onClick={onResetBearing}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
            title="Click to reset orientation to True North (0°)"
          >
            <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center">
              <Compass
                className="w-3.5 h-3.5 text-rose-500 transition-transform duration-200"
                style={{ transform: `rotate(${-viewport.bearingDeg}deg)` }}
              />
            </div>
            <div className="flex flex-col text-[10px] leading-tight text-left">
              <span className="font-bold text-slate-200">N</span>
              <span className="font-mono text-slate-400">{viewport.bearingDeg}°</span>
            </div>
          </button>

          <div className="h-4 w-px bg-slate-700" />

          {/* Dynamic Calibrated Metric Scale Bar */}
          <div className="flex flex-col items-center">
            <div
              className="flex justify-between text-[10px] font-mono text-slate-300"
              style={{ width: `${scaleBarWidthPx}px` }}
            >
              <span>0</span>
              <span>{scaleMeters / 2}m</span>
              <span>{scaleMeters}m</span>
            </div>
            <div
              className="h-1.5 border border-slate-400 border-t-0 flex"
              style={{ width: `${scaleBarWidthPx}px` }}
            >
              <div className="w-1/2 h-full bg-white" />
              <div className="w-1/2 h-full bg-slate-600" />
            </div>
          </div>
        </div>

        {/* Right: Dynamic Geographic Coordinates & Total Live Placed Capacity */}
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-md border border-slate-800 text-white shadow-md pointer-events-auto">
          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="text-slate-500">POS:</span>
            <span>
              {currentCenterGeo.latitude.toFixed(4)}° N, {currentCenterGeo.longitude.toFixed(4)}° E
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono font-bold text-white tabular-nums">{totalPanelsCount}</span>
            <span className="text-slate-400 text-[11px]">panels</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono font-bold text-blue-400 tabular-nums">
              {totalCapacityKwp.toFixed(2)} kWp
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
