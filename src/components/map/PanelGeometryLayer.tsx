import React from 'react';
import { 
  PanelPlacement, 
  PANEL_MODELS, 
  DEFAULT_PANEL_MODEL 
} from '../../types/solar';
import { MapViewportState } from '../../types/map';
import { metricToViewportScreen } from '../../utils/mapProjection';
import { getEffectivePanelAngle } from '../../utils/geometry';

interface PanelGeometryLayerProps {
  panels: PanelPlacement[];
  selectedPanelIds: string[];
  viewport: MapViewportState;
  onPanelClick: (e: React.MouseEvent, panel: PanelPlacement) => void;
  onPanelMouseDown: (e: React.MouseEvent, panel: PanelPlacement) => void;
}

/**
 * Layer 3: Panel Geometry Layer
 * Renders actual placed PV modules (source of truth).
 * Dimensions and coordinates scale strictly in real metric units.
 */
export const PanelGeometryLayer: React.FC<PanelGeometryLayerProps> = ({
  panels,
  selectedPanelIds,
  viewport,
  onPanelClick,
  onPanelMouseDown,
}) => {
  return (
    <g id="layer-panel-geometry">
      {panels.map((panel) => {
        const isSelected = selectedPanelIds.includes(panel.id);
        const panelModel = PANEL_MODELS.find((m) => m.id === panel.panelModelId) || DEFAULT_PANEL_MODEL;

        // Base metric dimensions in metres from physical panel model definition
        const widthPx = panelModel.widthM * viewport.pixelsPerMeter;
        const heightPx = panelModel.heightM * viewport.pixelsPerMeter;

        const centerScreen = metricToViewportScreen({ x: panel.xM, y: panel.yM }, viewport);
        const effectiveAngle = getEffectivePanelAngle(panel);
        const totalRotationDeg = effectiveAngle + viewport.bearingDeg;

        return (
          <g
            key={panel.id}
            transform={`translate(${centerScreen.x}, ${centerScreen.y}) rotate(${totalRotationDeg})`}
            onClick={(e) => onPanelClick(e, panel)}
            onMouseDown={(e) => onPanelMouseDown(e, panel)}
            className={`group transition-opacity ${isSelected ? 'cursor-move' : 'cursor-pointer hover:opacity-95'}`}
          >
            {/* Monocrystalline Solar Cell Wafer Surface */}
            <rect
              x={-widthPx / 2}
              y={-heightPx / 2}
              width={widthPx}
              height={heightPx}
              fill="#172554"
              fillOpacity="0.9"
              stroke={isSelected ? '#38bdf8' : '#64748b'}
              strokeWidth={isSelected ? 2 : 0.75}
              rx="1"
            />

            {/* PV Cell Internal Busbars (Visible under zoom) */}
            <line
              x1={-widthPx / 2}
              y1="0"
              x2={widthPx / 2}
              y2="0"
              stroke="#1e3a8a"
              strokeWidth="0.5"
              className="pointer-events-none"
            />
            <line
              x1="0"
              y1={-heightPx / 2}
              x2="0"
              y2={heightPx / 2}
              stroke="#3b82f6"
              strokeWidth="0.4"
              strokeOpacity="0.7"
              className="pointer-events-none"
            />

            {/* Module Orientation Notch */}
            <circle
              cx="0"
              cy={-heightPx / 2 + Math.max(1.5, 0.1 * viewport.pixelsPerMeter)}
              r={Math.max(0.6, 0.05 * viewport.pixelsPerMeter)}
              fill="#93c5fd"
              className="pointer-events-none"
            />

            {/* Selected Corner Highlights */}
            {isSelected && (
              <>
                <circle cx={-widthPx / 2} cy={-heightPx / 2} r="2.5" fill="#38bdf8" />
                <circle cx={widthPx / 2} cy={-heightPx / 2} r="2.5" fill="#38bdf8" />
                <circle cx={widthPx / 2} cy={heightPx / 2} r="2.5" fill="#38bdf8" />
                <circle cx={-widthPx / 2} cy={heightPx / 2} r="2.5" fill="#38bdf8" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};
