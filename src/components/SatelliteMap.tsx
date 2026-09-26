import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RoofPlane, 
  PanelPlacement, 
  Obstacle, 
  ActiveTool, 
  MetricPoint,
  GeoCoordinate 
} from '../types/solar';
import { MapViewportState } from '../types/map';
import { 
  viewportScreenToMetric, 
  calculatePixelsPerMeter 
} from '../utils/mapProjection';
import { distanceInMeters, isPointInPolygon } from '../utils/geometry';
import { PANEL_MODELS, DEFAULT_PANEL_MODEL } from '../types/solar';

// The 5 cleanly separated architectural map layers
import { SatelliteMapLayer } from './map/SatelliteMapLayer';
import { RoofGeometryLayer } from './map/RoofGeometryLayer';
import { PanelGeometryLayer } from './map/PanelGeometryLayer';
import { ObstacleLayer } from './map/ObstacleLayer';
import { AnnotationLayer } from './map/AnnotationLayer';
import { MapControlsOverlay } from './map/MapControlsOverlay';

interface SatelliteMapProps {
  roofs: RoofPlane[];
  selectedRoofId: string | null;
  onSelectRoof: (id: string | null) => void;
  onUpdateRoofPointsM: (id: string, pointsM: MetricPoint[]) => void;
  onCreateRoofM: (pointsM: MetricPoint[]) => void;
  panels: PanelPlacement[];
  selectedPanelIds: string[];
  onSelectPanels: (ids: string[]) => void;
  onUpdatePanels: (updatedPanels: PanelPlacement[]) => void;
  obstacles: Obstacle[];
  onAddObstacle: (obs: Obstacle) => void;
  activeTool: ActiveTool;
  onToolComplete: () => void;
  geoOrigin?: GeoCoordinate;
}

const DEFAULT_ORIGIN: GeoCoordinate = {
  latitude: 42.6480,
  longitude: 77.0850,
  altitudeM: 1608,
};

/**
 * Clean Map Workspace Architecture:
 * 
 * Layer 1: Satellite / Map Layer (SatelliteMapLayer)
 * Layer 2: Roof Geometry Layer (RoofGeometryLayer)
 * Layer 3: Panel Geometry Layer (PanelGeometryLayer)
 * Layer 4: Obstacles Layer (ObstacleLayer)
 * Layer 5: Measurement / Annotation Layer (AnnotationLayer)
 * 
 * All engineering geometry is represented in real metric coordinates (metres).
 * The map maintains geographic stability during pan, zoom, scale, and rotation.
 */
export const SatelliteMap: React.FC<SatelliteMapProps> = ({
  roofs,
  selectedRoofId,
  onSelectRoof,
  onUpdateRoofPointsM,
  onCreateRoofM,
  panels,
  selectedPanelIds,
  onSelectPanels,
  onUpdatePanels,
  obstacles,
  onAddObstacle,
  activeTool,
  onToolComplete,
  geoOrigin = DEFAULT_ORIGIN,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Geographic Map Viewport State (Metres, Scale, Geographic Coordinates)
  const [viewport, setViewport] = useState<MapViewportState>({
    centerGeo: geoOrigin,
    centerMetric: { x: 43.75, y: 28.125 }, // Center of the 87.5m x 56.25m rooftop footprint
    zoom: 19.0,
    bearingDeg: 0, // 0 = True North up
    pitchDeg: 0,
    pixelsPerMeter: 16, // Initial metric scale: 16 screen px = 1.0 metre
    widthPx: 1400,
    heightPx: 900,
  });

  const [mapMode, setMapMode] = useState<'satellite' | 'cad'>('satellite');

  // Sync container pixel dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setViewport((prev) => ({
            ...prev,
            widthPx: Math.round(width),
            heightPx: Math.round(height),
          }));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pan interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [panStartMouse, setPanStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panStartCenterMetric, setPanStartCenterMetric] = useState<MetricPoint>({ x: 43.75, y: 28.125 });

  // CAD Tool States in Metric Coordinates
  const [drawingPointsM, setDrawingPointsM] = useState<MetricPoint[]>([]);
  const [cursorPosM, setCursorPosM] = useState<MetricPoint>({ x: 0, y: 0 });

  const [measureStartM, setMeasureStartM] = useState<MetricPoint | null>(null);
  const [measureEndM, setMeasureEndM] = useState<MetricPoint | null>(null);
  const [savedMeasurements, setSavedMeasurements] = useState<{ p1: MetricPoint; p2: MetricPoint }[]>([]);

  const [selectionBoxM, setSelectionBoxM] = useState<{ startM: MetricPoint; currentM: MetricPoint } | null>(null);

  // Dragging vertex or panel
  const [draggingVertex, setDraggingVertex] = useState<{ roofId: string; index: number } | null>(null);
  const [draggingPanels, setDraggingPanels] = useState<boolean>(false);
  const [dragStartPointM, setDragStartPointM] = useState<MetricPoint | null>(null);

  // Convert client mouse event to metric coordinates using map projection
  const getMouseMetric = useCallback((e: React.MouseEvent): MetricPoint => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const screenPt = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    return viewportScreenToMetric(screenPt, viewport);
  }, [viewport]);

  // Handle Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    const metric = getMouseMetric(e);

    // Pan with Middle Click, Spacebar or Pan Tool
    if (e.button === 1 || activeTool === 'pan' || e.altKey) {
      setIsPanning(true);
      setPanStartMouse({ x: e.clientX, y: e.clientY });
      setPanStartCenterMetric({ ...viewport.centerMetric });
      return;
    }

    if (e.button !== 0) return;

    // Tool: Draw Roof
    if (activeTool === 'draw-roof') {
      if (drawingPointsM.length >= 3) {
        // If clicked close to start point (< 1.2m), close polygon
        const p0 = drawingPointsM[0];
        const distM = distanceInMeters(metric, p0);
        if (distM < 1.2) {
          finishDrawingRoof();
          return;
        }
      }
      setDrawingPointsM([...drawingPointsM, metric]);
      return;
    }

    // Tool: Measure
    if (activeTool === 'measure') {
      if (!measureStartM) {
        setMeasureStartM(metric);
        setMeasureEndM(metric);
      } else {
        setSavedMeasurements([...savedMeasurements, { p1: measureStartM, p2: metric }]);
        setMeasureStartM(null);
        setMeasureEndM(null);
      }
      return;
    }

    // Tool: Obstacle placement
    if (activeTool === 'obstacle') {
      onAddObstacle({
        id: `obs-${Date.now()}`,
        name: 'Rooftop HVAC Unit',
        type: 'hvac',
        xM: metric.x,
        yM: metric.y,
        widthM: 2.4,
        heightM: 1.8,
      });
      onToolComplete();
      return;
    }

    // Tool: Panels - Click on roof to place single panel
    if (activeTool === 'panels') {
      const targetRoof = roofs.find(r => isPointInPolygon(metric, r.polygonM));
      if (targetRoof) {
        const model = PANEL_MODELS.find(m => m.id === targetRoof.panelModelId) || DEFAULT_PANEL_MODEL;
        const newPanel: PanelPlacement = {
          id: `p-${targetRoof.id}-manual-${Date.now().toString(36)}`,
          roofId: targetRoof.id,
          xM: Math.round(metric.x * 100) / 100,
          yM: Math.round(metric.y * 100) / 100,
          rotationDeg: 0,
          orientation: targetRoof.orientation,
          panelModelId: model.id,
          powerWatts: model.powerWatts,
        };
        onUpdatePanels([...panels, newPanel]);
        onSelectPanels([newPanel.id]);
        onSelectRoof(targetRoof.id);
        return;
      }
    }

    // Tool: Select Mode - Marquee or deselect if clicked on empty canvas
    if (activeTool === 'select') {
      setSelectionBoxM({ startM: metric, currentM: metric });
      if (!e.shiftKey) {
        onSelectPanels([]);
      }
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const metric = getMouseMetric(e);
    setCursorPosM(metric);

    // Map Panning (Geographically stable translation)
    if (isPanning) {
      const dxPx = e.clientX - panStartMouse.x;
      const dyPx = e.clientY - panStartMouse.y;
      const dxM = dxPx / viewport.pixelsPerMeter;
      const dyM = dyPx / viewport.pixelsPerMeter;

      setViewport((prev) => ({
        ...prev,
        centerMetric: {
          x: Math.round((panStartCenterMetric.x - dxM) * 100) / 100,
          y: Math.round((panStartCenterMetric.y - dyM) * 100) / 100,
        },
      }));
      return;
    }

    // Measure tool preview
    if (activeTool === 'measure' && measureStartM) {
      setMeasureEndM(metric);
      return;
    }

    // Marquee box selection
    if (selectionBoxM) {
      setSelectionBoxM({ ...selectionBoxM, currentM: metric });
      const minX = Math.min(selectionBoxM.startM.x, metric.x);
      const maxX = Math.max(selectionBoxM.startM.x, metric.x);
      const minY = Math.min(selectionBoxM.startM.y, metric.y);
      const maxY = Math.max(selectionBoxM.startM.y, metric.y);

      const captured = panels.filter(
        (p) => p.xM >= minX && p.xM <= maxX && p.yM >= minY && p.yM <= maxY
      );
      onSelectPanels(captured.map((p) => p.id));
      return;
    }

    // Dragging roof vertex in metric coordinates
    if (draggingVertex) {
      const roof = roofs.find((r) => r.id === draggingVertex.roofId);
      if (roof) {
        const newPtsM = [...roof.polygonM];
        newPtsM[draggingVertex.index] = metric;
        onUpdateRoofPointsM(roof.id, newPtsM);
      }
      return;
    }

    // Dragging panels in metric coordinates
    if (draggingPanels && dragStartPointM && selectedPanelIds.length > 0) {
      const dxM = metric.x - dragStartPointM.x;
      const dyM = metric.y - dragStartPointM.y;
      if (Math.abs(dxM) > 0.02 || Math.abs(dyM) > 0.02) {
        hasMovedDragRef.current = true;
        const updated = panels.map((p) => {
          if (selectedPanelIds.includes(p.id)) {
            return {
              ...p,
              xM: Math.round((p.xM + dxM) * 100) / 100,
              yM: Math.round((p.yM + dyM) * 100) / 100,
            };
          }
          return p;
        });
        onUpdatePanels(updated);
        setDragStartPointM(metric);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setSelectionBoxM(null);
    setDraggingVertex(null);
    setDraggingPanels(false);
    setDragStartPointM(null);
  };

  // Zoom control handlers (Geographically stable zoom around viewport center)
  const handleZoom = (delta: number) => {
    setViewport((prev) => {
      const newZoom = Math.min(22.0, Math.max(17.5, prev.zoom + delta));
      const newPpm = calculatePixelsPerMeter(newZoom, geoOrigin.latitude);
      return {
        ...prev,
        zoom: newZoom,
        pixelsPerMeter: Math.round(newPpm * 10) / 10,
      };
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
    handleZoom(zoomDelta);
  };

  const resetView = () => {
    setViewport((prev) => ({
      ...prev,
      centerMetric: { x: 43.75, y: 28.125 },
      zoom: 19.0,
      pixelsPerMeter: 16,
      bearingDeg: 0,
    }));
  };

  const resetBearing = () => {
    setViewport((prev) => ({ ...prev, bearingDeg: 0 }));
  };

  const finishDrawingRoof = () => {
    if (drawingPointsM.length >= 3) {
      onCreateRoofM(drawingPointsM);
      setDrawingPointsM([]);
      onToolComplete();
    }
  };

  const cancelDrawingRoof = () => {
    setDrawingPointsM([]);
    onToolComplete();
  };

  // Track whether mouse moved during dragging to differentiate drag from click
  const hasMovedDragRef = useRef(false);

  // Panel click and drag handlers
  const handlePanelClick = (e: React.MouseEvent, panel: PanelPlacement) => {
    e.stopPropagation();
    if (hasMovedDragRef.current) {
      hasMovedDragRef.current = false;
      return;
    }

    if (activeTool === 'select' || activeTool === 'panels') {
      if (e.shiftKey) {
        if (selectedPanelIds.includes(panel.id)) {
          onSelectPanels(selectedPanelIds.filter((id) => id !== panel.id));
        } else {
          onSelectPanels([...selectedPanelIds, panel.id]);
        }
      } else {
        onSelectPanels([panel.id]);
      }
      onSelectRoof(panel.roofId);
    }
  };

  const handlePanelMouseDown = (e: React.MouseEvent, panel: PanelPlacement) => {
    e.stopPropagation();
    hasMovedDragRef.current = false;

    if (activeTool === 'select' || activeTool === 'panels') {
      // If panel is already selected in a group, maintain the group selection for group movement!
      const isAlreadySelected = selectedPanelIds.includes(panel.id);
      if (!isAlreadySelected) {
        if (e.shiftKey) {
          onSelectPanels([...selectedPanelIds, panel.id]);
        } else {
          onSelectPanels([panel.id]);
        }
      }
      onSelectRoof(panel.roofId);
      setDraggingPanels(true);
      setDragStartPointM(getMouseMetric(e));
    }
  };

  const totalPanelsCount = panels.length;
  const totalCapacityKwp = panels.reduce((sum, p) => sum + p.powerWatts, 0) / 1000;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 h-full bg-slate-900 overflow-hidden select-none ${
        activeTool === 'pan' || isPanning
          ? 'cursor-grab-cad'
          : activeTool === 'draw-roof' || activeTool === 'measure'
          ? 'cursor-crosshair-cad'
          : 'cursor-default'
      }`}
    >
      {/* CAD Map Canvas SVG World */}
      <svg
        width={viewport.widthPx}
        height={viewport.heightPx}
        viewBox={`0 0 ${viewport.widthPx} ${viewport.heightPx}`}
        className="w-full h-full block"
      >
        {/* Layer 1: Satellite / Map Base Layer */}
        <SatelliteMapLayer viewport={viewport} mapMode={mapMode} />

        {/* Layer 2: Roof Geometry Layer */}
        <RoofGeometryLayer
          roofs={roofs}
          selectedRoofId={selectedRoofId}
          viewport={viewport}
          onSelectRoof={(id) => onSelectRoof(id)}
          onVertexMouseDown={(roofId, idx) => setDraggingVertex({ roofId, index: idx })}
        />

        {/* Layer 4: Obstacles Keep-out Layer */}
        <ObstacleLayer obstacles={obstacles} viewport={viewport} />

        {/* Layer 3: Panel Geometry Layer (Placed Modules) */}
        <PanelGeometryLayer
          panels={panels}
          selectedPanelIds={selectedPanelIds}
          viewport={viewport}
          onPanelClick={handlePanelClick}
          onPanelMouseDown={handlePanelMouseDown}
        />

        {/* Layer 5: Measurement & Annotation Layer */}
        <AnnotationLayer
          activeTool={activeTool}
          drawingPointsM={drawingPointsM}
          cursorPosM={cursorPosM}
          savedMeasurements={savedMeasurements}
          measureStartM={measureStartM}
          measureEndM={measureEndM}
          selectionBoxM={selectionBoxM}
          viewport={viewport}
        />
      </svg>

      {/* Map Controls HUD & Status Bar Overlay */}
      <MapControlsOverlay
        viewport={viewport}
        onZoomIn={() => handleZoom(0.25)}
        onZoomOut={() => handleZoom(-0.25)}
        onResetView={resetView}
        onResetBearing={resetBearing}
        mapMode={mapMode}
        onToggleMapMode={setMapMode}
        activeTool={activeTool}
        drawingVertexCount={drawingPointsM.length}
        onFinishDrawingRoof={finishDrawingRoof}
        onCancelDrawingRoof={cancelDrawingRoof}
        onClearMeasurements={() => setSavedMeasurements([])}
        hasMeasurements={savedMeasurements.length > 0}
        totalPanelsCount={totalPanelsCount}
        totalCapacityKwp={totalCapacityKwp}
        geoOrigin={geoOrigin}
      />
    </div>
  );
};
