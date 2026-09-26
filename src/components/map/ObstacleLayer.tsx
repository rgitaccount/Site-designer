import React from 'react';
import { Obstacle } from '../../types/solar';
import { MapViewportState } from '../../types/map';
import { metricToViewportScreen } from '../../utils/mapProjection';

interface ObstacleLayerProps {
  obstacles: Obstacle[];
  viewport: MapViewportState;
}

/**
 * Layer 4: Obstacles Keep-Out Layer
 * Renders rooftop obstructions (HVAC chillers, skylights, vents) in real metric units.
 */
export const ObstacleLayer: React.FC<ObstacleLayerProps> = ({
  obstacles,
  viewport,
}) => {
  return (
    <g id="layer-obstacles">
      <defs>
        <pattern
          id="obstacle-hatch-pattern"
          width="8"
          height="8"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeOpacity="0.75"
          />
        </pattern>
      </defs>

      {obstacles.map((obs) => {
        const centerScreen = metricToViewportScreen({ x: obs.xM, y: obs.yM }, viewport);
        const screenW = obs.widthM * viewport.pixelsPerMeter;
        const screenH = obs.heightM * viewport.pixelsPerMeter;

        return (
          <g
            key={obs.id}
            transform={`translate(${centerScreen.x - screenW / 2}, ${centerScreen.y - screenH / 2})`}
          >
            <rect
              width={screenW}
              height={screenH}
              fill="url(#obstacle-hatch-pattern)"
              stroke="#f43f5e"
              strokeWidth="1.5"
              rx="2"
            />
            <text
              x={screenW / 2}
              y={screenH / 2 + 3}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
              className="pointer-events-none drop-shadow"
            >
              HVAC
            </text>
          </g>
        );
      })}
    </g>
  );
};
