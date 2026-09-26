import React from 'react';
import { MetricPoint, ActiveTool } from '../../types/solar';
import { MapViewportState } from '../../types/map';
import { metricToViewportScreen } from '../../utils/mapProjection';
import { distanceInMeters } from '../../utils/geometry';

interface AnnotationLayerProps {
  activeTool: ActiveTool;
  drawingPointsM: MetricPoint[];
  cursorPosM: MetricPoint;
  savedMeasurements: { p1: MetricPoint; p2: MetricPoint }[];
  measureStartM: MetricPoint | null;
  measureEndM: MetricPoint | null;
  selectionBoxM: { startM: MetricPoint; currentM: MetricPoint } | null;
  viewport: MapViewportState;
}

/**
 * Layer 5: Measurement & Annotation Layer
 * Renders CAD dimensions, in-progress polygon edges, and marquee drag boxes in metric space.
 */
export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  activeTool,
  drawingPointsM,
  cursorPosM,
  savedMeasurements,
  measureStartM,
  measureEndM,
  selectionBoxM,
  viewport,
}) => {
  return (
    <g id="layer-annotations" className="pointer-events-none">
      {/* 1. In-progress Roof Polygon Drawing */}
      {activeTool === 'draw-roof' && drawingPointsM.length > 0 && (
        <g>
          <polyline
            points={[...drawingPointsM, cursorPosM]
              .map((pM) => metricToViewportScreen(pM, viewport))
              .map((p) => `${p.x},${p.y}`)
              .join(' ')}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {drawingPointsM.map((ptM, idx) => {
            const pt = metricToViewportScreen(ptM, viewport);
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 ? 6 : 4}
                fill={idx === 0 ? '#38bdf8' : '#ffffff'}
                stroke="#0284c7"
                strokeWidth="2"
              />
            );
          })}

          {/* Edge distance labels in metres */}
          {drawingPointsM.map((ptM, idx) => {
            const nextPtM = idx < drawingPointsM.length - 1 ? drawingPointsM[idx + 1] : cursorPosM;
            const midScreen = metricToViewportScreen(
              {
                x: (ptM.x + nextPtM.x) / 2,
                y: (ptM.y + nextPtM.y) / 2,
              },
              viewport
            );
            const distM = distanceInMeters(ptM, nextPtM);

            return (
              <g key={`edge-dist-${idx}`} transform={`translate(${midScreen.x}, ${midScreen.y - 8})`}>
                <rect x="-18" y="-9" width="36" height="15" rx="3" fill="#0f172a" fillOpacity="0.85" />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {distM}m
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* 2. Saved Distance Measurements */}
      {savedMeasurements.map((m, idx) => {
        const distM = distanceInMeters(m.p1, m.p2);
        const p1Screen = metricToViewportScreen(m.p1, viewport);
        const p2Screen = metricToViewportScreen(m.p2, viewport);
        const midX = (p1Screen.x + p2Screen.x) / 2;
        const midY = (p1Screen.y + p2Screen.y) / 2;

        return (
          <g key={`saved-measure-${idx}`}>
            <line
              x1={p1Screen.x}
              y1={p1Screen.y}
              x2={p2Screen.x}
              y2={p2Screen.y}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            <circle cx={p1Screen.x} cy={p1Screen.y} r="3" fill="#fbbf24" />
            <circle cx={p2Screen.x} cy={p2Screen.y} r="3" fill="#fbbf24" />
            <g transform={`translate(${midX}, ${midY - 8})`}>
              <rect x="-24" y="-10" width="48" height="16" rx="3" fill="#0f172a" fillOpacity="0.9" />
              <text
                x="0"
                y="2"
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="10"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                {distM} m
              </text>
            </g>
          </g>
        );
      })}

      {/* 3. In-progress Live Measurement Line */}
      {activeTool === 'measure' && measureStartM && measureEndM && (
        <g>
          {(() => {
            const p1 = metricToViewportScreen(measureStartM, viewport);
            const p2 = metricToViewportScreen(measureEndM, viewport);
            const distM = distanceInMeters(measureStartM, measureEndM);

            return (
              <>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <circle cx={p1.x} cy={p1.y} r="4" fill="#fbbf24" />
                <circle cx={p2.x} cy={p2.y} r="4" fill="#fbbf24" />
                <g transform={`translate(${(p1.x + p2.x) / 2}, ${(p1.y + p2.y) / 2 - 10})`}>
                  <rect
                    x="-26"
                    y="-10"
                    width="52"
                    height="18"
                    rx="3"
                    fill="#0f172a"
                    fillOpacity="0.9"
                    stroke="#fbbf24"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {distM} m
                  </text>
                </g>
              </>
            );
          })()}
        </g>
      )}

      {/* 4. Marquee Selection Rectangle */}
      {selectionBoxM && (
        (() => {
          const p1 = metricToViewportScreen(selectionBoxM.startM, viewport);
          const p2 = metricToViewportScreen(selectionBoxM.currentM, viewport);
          return (
            <rect
              x={Math.min(p1.x, p2.x)}
              y={Math.min(p1.y, p2.y)}
              width={Math.abs(p2.x - p1.x)}
              height={Math.abs(p2.y - p1.y)}
              fill="#38bdf8"
              fillOpacity="0.15"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          );
        })()
      )}
    </g>
  );
};
