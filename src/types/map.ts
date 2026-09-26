import { MetricPoint, ScreenPoint, GeoCoordinate } from './solar';

/**
 * Map Viewport State & Camera Model
 * Provides the clean abstraction for connecting real satellite map providers (Google Maps, Mapbox, ESRI).
 */
export interface MapViewportState {
  centerGeo: GeoCoordinate; // Geographic center (lat, lng)
  centerMetric: MetricPoint; // Center position in local metric coordinates (metres)
  zoom: number; // Logarithmic zoom level (e.g. 18.0 - 22.0)
  bearingDeg: number; // Map rotation relative to True North (0 = North up)
  pitchDeg: number; // Viewport pitch/tilt (0 = top-down orthogonal)
  pixelsPerMeter: number; // Metric scale factor at current zoom level
  widthPx: number; // Viewport width in screen pixels
  heightPx: number; // Viewport height in screen pixels
}

/**
 * Geographic Bounding Box
 */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Metric Bounding Box in metres
 */
export interface MetricBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Map Provider Interface for future satellite provider plugins
 * (e.g. Google Maps Platform, Mapbox GL, ESRI World Imagery, Sentinel-2)
 */
export interface MapProviderConfig {
  providerId: 'generic-ortho' | 'google-maps' | 'mapbox-satellite' | 'esri-imagery';
  apiKey?: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  tileResolution: number;
}
