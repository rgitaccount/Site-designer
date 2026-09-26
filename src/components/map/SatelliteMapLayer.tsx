import React from 'react';
import { MapViewportState } from '../../types/map';
import { metricToViewportScreen } from '../../utils/mapProjection';
import { SATELLITE_IMAGE_SRC } from '../../assets/satellite';

interface SatelliteMapLayerProps {
  viewport: MapViewportState;
  mapMode: 'satellite' | 'cad';
}

/**
 * Layer 1: Satellite / Map Base Layer
 * Provides the visual geospatial raster canvas.
 * Designed with a clean abstraction so real satellite tile providers
 * (e.g., Google Maps Platform, Mapbox Satellite, ESRI World Imagery)
 * can be plugged in without changing higher-level engineering layers.
 */
export const SatelliteMapLayer: React.FC<SatelliteMapLayerProps> = ({
  viewport,
  mapMode,
}) => {
  // Orthophoto bounds in project metric coordinates:
  // 1400px x 900px base at 16 px/m = 87.5m x 56.25m
  const orthoOriginM = { x: 0, y: 0 };
  const orthoWidthM = 87.5;
  const orthoHeightM = 56.25;

  const screenOrigin = metricToViewportScreen(orthoOriginM, viewport);
  const screenWidth = orthoWidthM * viewport.pixelsPerMeter;
  const screenHeight = orthoHeightM * viewport.pixelsPerMeter;

  return (
    <g id="layer-satellite-map" className="pointer-events-none select-none">
      <defs>
        {/* Metric CAD Grid: 1 metre grid, 5 metre major grid */}
        <pattern
          id="metric-cad-grid"
          width={viewport.pixelsPerMeter}
          height={viewport.pixelsPerMeter}
          patternUnits="userSpaceOnUse"
          x={screenOrigin.x}
          y={screenOrigin.y}
        >
          <path
            d={`M ${viewport.pixelsPerMeter} 0 L 0 0 0 ${viewport.pixelsPerMeter}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern
          id="metric-cad-grid-major"
          width={viewport.pixelsPerMeter * 5}
          height={viewport.pixelsPerMeter * 5}
          patternUnits="userSpaceOnUse"
          x={screenOrigin.x}
          y={screenOrigin.y}
        >
          <path
            d={`M ${viewport.pixelsPerMeter * 5} 0 L 0 0 0 ${viewport.pixelsPerMeter * 5}`}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* 1. Underlying Base Imagery or Vector Blueprint */}
      {mapMode === 'satellite' ? (
        <image
          href={SATELLITE_IMAGE_SRC}
          x={screenOrigin.x}
          y={screenOrigin.y}
          width={screenWidth}
          height={screenHeight}
          preserveAspectRatio="none"
          transform={
            viewport.bearingDeg !== 0
              ? `rotate(${viewport.bearingDeg} ${viewport.widthPx / 2} ${viewport.heightPx / 2})`
              : undefined
          }
        />
      ) : (
        <rect
          width={viewport.widthPx}
          height={viewport.heightPx}
          fill="#0f172a"
        />
      )}

      {/* 2. Scaled Metric CAD Grid Overlay */}
      <rect
        width={viewport.widthPx}
        height={viewport.heightPx}
        fill="url(#metric-cad-grid)"
        opacity={mapMode === 'satellite' ? 0.22 : 0.6}
      />
      <rect
        width={viewport.widthPx}
        height={viewport.heightPx}
        fill="url(#metric-cad-grid-major)"
        opacity={mapMode === 'satellite' ? 0.35 : 0.8}
      />
    </g>
  );
};
