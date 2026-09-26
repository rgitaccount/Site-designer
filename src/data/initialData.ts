import { 
  RoofPlane, 
  PanelPlacement, 
  Obstacle, 
  ProjectInfo, 
  DEFAULT_PANEL_MODEL,
  MetricPoint 
} from '../types/solar';

export const INITIAL_PROJECT: ProjectInfo = {
  id: 'cholpon-ata-pv-1',
  name: 'ЭС Чолпон-Ата',
  client: 'Tien-Shan Logistics LLC',
  location: 'Industrial Park, Cholpon-Ata, Issyk-Kul',
  coordinates: '42.6480° N, 77.0850° E',
  date: '2026-09-26',
  engineer: 'N. Baidoletov, Solar PV Lead',
  currency: 'USD',
  geo: {
    latitude: 42.6480,
    longitude: 77.0850,
    altitudeM: 1608,
    locationName: 'Cholpon-Ata, Kyrgyzstan',
  },
};

// Metric Roof Polygons (coordinates in metres relative to project local origin)
// Scale: 1m = 16 canvas pixels (e.g. 20m = 320px)
export const INITIAL_ROOFS: RoofPlane[] = [
  {
    id: 'roof-a',
    name: 'Roof A',
    color: '#3b82f6', // blue
    polygonM: [
      { x: 17.5, y: 12.5 },
      { x: 38.5, y: 12.5 },
      { x: 38.5, y: 27.0 },
      { x: 17.5, y: 27.0 },
    ],
    azimuthDeg: 180, // Physical roof orientation: South
    tiltDeg: 25,     // Physical inclination: 25°
    edgeSetbackM: 0.50,
    panelModelId: DEFAULT_PANEL_MODEL.id,
    panelPowerWatts: DEFAULT_PANEL_MODEL.powerWatts, // 625 W
    orientation: 'portrait',
    rowSpacingM: 0.35,
  },
  {
    id: 'roof-b',
    name: 'Roof B',
    color: '#10b981', // emerald
    polygonM: [
      { x: 41.5, y: 12.5 },
      { x: 61.5, y: 12.5 },
      { x: 61.5, y: 25.5 },
      { x: 41.5, y: 25.5 },
    ],
    azimuthDeg: 270, // Physical roof orientation: West
    tiltDeg: 15,     // Physical inclination: 15°
    edgeSetbackM: 0.50,
    panelModelId: DEFAULT_PANEL_MODEL.id,
    panelPowerWatts: DEFAULT_PANEL_MODEL.powerWatts, // 625 W
    orientation: 'portrait',
    rowSpacingM: 0.35,
  },
];

export const INITIAL_OBSTACLES: Obstacle[] = [
  {
    id: 'obs-hvac-1',
    roofId: 'roof-a',
    name: 'HVAC Chiller Unit',
    type: 'hvac',
    xM: 36.0,
    yM: 24.5,
    widthM: 2.2,
    heightM: 1.8,
  },
  {
    id: 'obs-skylight-1',
    roofId: 'roof-b',
    name: 'Skylight Hatch',
    type: 'skylight',
    xM: 58.5,
    yM: 15.5,
    widthM: 1.6,
    heightM: 2.4,
  }
];

/**
 * Creates initial placed panels in metric coordinates (metres)
 * Exactly matching the required initial state:
 * - Roof A: 24 panels (4 rows × 6 cols) × 625 W = 15.00 kWp (180° / 25°)
 * - Roof B: 18 panels (3 rows × 6 cols) × 625 W = 11.25 kWp (270° / 15°)
 * -----------------------------------------------------------------
 * TOTAL: 42 panels, 26.25 kWp
 */
export function createInitialPanels(): PanelPlacement[] {
  const panels: PanelPlacement[] = [];
  const model = DEFAULT_PANEL_MODEL;
  const modWidthM = model.widthM;   // 1.134 m
  const modHeightM = model.heightM; // 2.384 m
  const gapXM = 0.05; // 5 cm
  const gapYM = 0.35; // 35 cm walkway

  // Roof A: 4 rows x 6 cols = 24 panels
  const startAxM = 20.0;
  const startAyM = 14.5;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      panels.push({
        id: `panel-a-${r}-${c}`,
        roofId: 'roof-a',
        xM: Math.round((startAxM + c * (modWidthM + gapXM) + modWidthM / 2) * 100) / 100,
        yM: Math.round((startAyM + r * (modHeightM + gapYM) + modHeightM / 2) * 100) / 100,
        rotationDeg: 0, // Visual orientation aligned with building grid
        orientation: 'portrait',
        panelModelId: model.id,
        powerWatts: model.powerWatts,
        row: r,
        col: c,
      });
    }
  }

  // Roof B: 3 rows x 6 cols = 18 panels
  const startBxM = 43.8;
  const startByM = 15.0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      panels.push({
        id: `panel-b-${r}-${c}`,
        roofId: 'roof-b',
        xM: Math.round((startBxM + c * (modWidthM + gapXM) + modWidthM / 2) * 100) / 100,
        yM: Math.round((startByM + r * (modHeightM + gapYM) + modHeightM / 2) * 100) / 100,
        rotationDeg: 0, // Visual orientation
        orientation: 'portrait',
        panelModelId: model.id,
        powerWatts: model.powerWatts,
        row: r,
        col: c,
      });
    }
  }

  return panels;
}
