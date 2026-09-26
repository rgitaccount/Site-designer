import React from 'react';
import { RoofPlane } from '../../types/solar';
import { MapViewportState } from '../../types/map';
import { metricToViewportScreen } from '../../utils/mapProjection';
import { calculatePolygonAreaM2 } from '../../utils/geometry';

interface RoofGeometryLayerProps {
  roofs: RoofPlane[];
  selectedRoofId: string | null;
  viewport: MapViewportState;
  onSelectRoof: (id: string) => void;
  onVertexMouseDown: (roofId: string, index: number) => void;
}

/**
 * Layer 2: Roof Geometry Layer
 * Renders independent metric roof planes, edge setbacks, area tags, and vertex handles.
 * Geometrically stable across pan and zoom.
 */
export const RoofGeometryLayer: React.FC<RoofGeometryLayerProps> = ({
  roofs,
  selectedRoofId,
  viewport,
  onSelectRoof,
  onVertexMouseDown,
}) => {
  return (
    <g id="layer-roof-geometry">
      {roofs.map((roof) => {
        const isSelected = selectedRoofId === roof.id;
        const screenPoints = roof.polygonM.map((pM) => metricToViewportScreen(pM, viewport));
        const pointsString = screenPoints.map((p) => `${p.x},${p.y}`).join(' ');
        const areaM2 = calculatePolygonAreaM2(roof.polygonM);

        const avgScreenX = screenPoints.reduce((s, p) => s + p.x, 0) / screenPoints.length;
        const avgScreenY = screenPoints.reduce((s, p) => s + p.y, 0) / screenPoints.length;

        return (
          <g key={roof.id} className="cursor-pointer">
            {/* Primary Roof Polygon Fill & Perimeter Stroke */}
            <polygon
              points={pointsString}
              fill={roof.color}
              fillOpacity={isSelected ? 0.22 : 0.14}
              stroke={roof.color}
              strokeWidth={isSelected ? 2.5 : 1.75}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRoof(roof.id);
              }}
              className="transition-colors duration-150"
            />

            {/* Edge Setback Guideline (Inner dashed boundary) */}
            <polygon
              points={pointsString}
              fill="none"
              stroke={roof.color}
              strokeWidth="1"
              strokeDasharray="4,4"
              strokeOpacity="0.75"
              className="pointer-events-none"
            />

            {/* Center Information Tag: Name, Derived Area (m²), Physical Azimuth */}
            <g transform={`translate(${avgScreenX}, ${avgScreenY})`} className="pointer-events-none select-none">
              <rect
                x="-42"
                y="-18"
                width="84"
                height="24"
                rx="3"
                fill="#0f172a"
                fillOpacity="0.88"
                stroke={roof.color}
                strokeWidth="1"
              />
              <text
                x="0"
                y="-3"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {roof.name}
              </text>
              <text
                x="0"
                y="16"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {areaM2} m² · {roof.azimuthDeg}°
              </text>
            </g>

            {/* Vertex Grab Handles (when selected) */}
            {isSelected &&
              screenPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#ffffff"
                  stroke={roof.color}
                  strokeWidth="2.5"
                  className="cursor-move hover:r-6 transition-all"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onVertexMouseDown(roof.id, idx);
                  }}
                />
              ))}
          </g>
        );
      })}
    </g>
  );
};
