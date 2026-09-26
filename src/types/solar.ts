/**
 * NurSun Proposal Studio - PV Engineering Domain Model
 * Primary geometry is based on independent Roof Planes with local metric coordinates (metres).
 */

// 1. Coordinate Systems
export interface MetricPoint {
  x: number; // position in metres (local project coordinate system)
  y: number; // position in metres (local project coordinate system)
}

export interface ScreenPoint {
  x: number; // canvas rendering pixels
  y: number; // canvas rendering pixels
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitudeM?: number;
}

export interface GeoReference extends GeoCoordinate {
  locationName: string;
}

// Coordinate transform constants
// Scale: 16 screen canvas pixels = 1.0 metre
export const PIXELS_PER_METER = 16;
export const METERS_PER_PIXEL = 1 / PIXELS_PER_METER;

export function metricToScreen(pt: MetricPoint): ScreenPoint {
  return {
    x: Math.round(pt.x * PIXELS_PER_METER * 10) / 10,
    y: Math.round(pt.y * PIXELS_PER_METER * 10) / 10,
  };
}

export function screenToMetric(pt: ScreenPoint): MetricPoint {
  return {
    x: Math.round(pt.x * METERS_PER_PIXEL * 100) / 100,
    y: Math.round(pt.y * METERS_PER_PIXEL * 100) / 100,
  };
}

// 2. PV Module Models (Realistic Physical Dimensions & Electrical Ratings)
export interface PanelModel {
  id: string;
  brand: string;
  model: string;
  powerWatts: number;
  widthM: number;  // Physical width in metres (e.g. 1.134 m)
  heightM: number; // Physical height in metres (e.g. 2.384 m)
  efficiency: number; // %
}

export const PANEL_MODELS: PanelModel[] = [
  {
    id: 'jinko-66hl4m-bdv',
    brand: 'Jinko Solar',
    model: '66HL4M-BDV',
    powerWatts: 625,
    widthM: 1.134,
    heightM: 2.384,
    efficiency: 22.72,
  },
  {
    id: 'longi-lr5-72hth',
    brand: 'LONGi Solar',
    model: 'Hi-MO 6 LR5-72HTH',
    powerWatts: 600,
    widthM: 1.134,
    heightM: 2.278,
    efficiency: 23.2,
  },
  {
    id: 'trina-deg21c',
    brand: 'Trina Solar',
    model: 'Vertex TSM-DEG21C.20',
    powerWatts: 670,
    widthM: 1.303,
    heightM: 2.384,
    efficiency: 21.6,
  },
  {
    id: 'canadian-cs7n',
    brand: 'Canadian Solar',
    model: 'TOPBiHiKu7 CS7N-650',
    powerWatts: 650,
    widthM: 1.303,
    heightM: 2.384,
    efficiency: 22.5,
  }
];

export const DEFAULT_PANEL_MODEL = PANEL_MODELS[0]; // Jinko Solar 66HL4M-BDV (625 W, 1.134m x 2.384m)

// 3. Obstacle Keep-Out Zones (in metric units)
export interface Obstacle {
  id: string;
  roofId?: string;
  name: string;
  type: 'hvac' | 'skylight' | 'chimney' | 'vent';
  xM: number;      // Center x in metres
  yM: number;      // Center y in metres
  widthM: number;  // Dimension in metres
  heightM: number; // Dimension in metres
}

// 4. Panel Placement (The Source of Truth for Panel Counts & Capacity)
// SEPARATION: Panel rotation is visual orientation on the roof; roof azimuth is physical slope orientation.
export interface PanelPlacement {
  id: string;
  roofId: string;
  xM: number; // Center x in local metric coordinates (metres)
  yM: number; // Center y in local metric coordinates (metres)
  rotationDeg: number; // Visual arrangement angle on the roof (0°, 90°, etc.)
  orientation: 'portrait' | 'landscape';
  panelModelId: string;
  powerWatts: number;
  row?: number;
  col?: number;
}

// 5. Roof Plane (Primary Engineering Geometry)
export interface RoofPlane {
  id: string;
  name: string;
  color: string;
  polygonM: MetricPoint[]; // Boundary polygon in local metres
  azimuthDeg: number;      // Physical roof plane azimuth in degrees (0-360, 180 is South)
  tiltDeg: number;         // Physical roof pitch/inclination in degrees (0-90)
  edgeSetbackM: number;    // Edge setback in metres (e.g. 0.50 m)
  panelModelId: string;    // Associated panel model ID
  panelPowerWatts: number; // Panel rated power in Watts
  orientation: 'portrait' | 'landscape';
  rowSpacingM: number;     // Maintenance corridor pitch between rows in metres
}

// 6. Application Workflow & Tooling
export type ActiveTool = 'select' | 'draw-roof' | 'panels' | 'obstacle' | 'measure' | 'pan';
export type WorkflowStep = 'designer' | 'system' | 'production' | 'pricing' | 'proposal';

export interface ProjectInfo {
  id: string;
  name: string;
  client: string;
  location: string;
  coordinates: string;
  date: string;
  engineer: string;
  currency: string;
  geo: GeoReference;
}
