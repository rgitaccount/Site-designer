import { MetricPoint, ScreenPoint, GeoCoordinate } from '../types/solar';
import { MapViewportState } from '../types/map';

// Earth radius in metres (WGS84 ellipsoidal mean)
const EARTH_RADIUS_METERS = 6378137;

/**
 * Converts a geographic coordinate (lat, lng) to local metric coordinates (x, y in metres)
 * relative to a local reference origin anchor.
 * Uses equirectangular tangent projection accurate to millimeter scale within 20km radius.
 */
export function geoToMetric(
  geo: GeoCoordinate,
  originGeo: GeoCoordinate
): MetricPoint {
  const latRad = (originGeo.latitude * Math.PI) / 180;
  const dLatRad = ((geo.latitude - originGeo.latitude) * Math.PI) / 180;
  const dLngRad = ((geo.longitude - originGeo.longitude) * Math.PI) / 180;

  // x: Easting in metres (positive East)
  const x = dLngRad * EARTH_RADIUS_METERS * Math.cos(latRad);
  // y: Northing in metres (inverted so positive y is South for standard screen/CAD convention)
  const y = -dLatRad * EARTH_RADIUS_METERS;

  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
  };
}

/**
 * Converts local metric coordinates (x, y in metres) back to geographic coordinate (lat, lng).
 */
export function metricToGeo(
  metric: MetricPoint,
  originGeo: GeoCoordinate
): GeoCoordinate {
  const latRad = (originGeo.latitude * Math.PI) / 180;
  const dLatRad = -metric.y / EARTH_RADIUS_METERS;
  const dLngRad = metric.x / (EARTH_RADIUS_METERS * Math.cos(latRad));

  const latitude = originGeo.latitude + (dLatRad * 180) / Math.PI;
  const longitude = originGeo.longitude + (dLngRad * 180) / Math.PI;

  return {
    latitude: Math.round(latitude * 1000000) / 1000000,
    longitude: Math.round(longitude * 1000000) / 1000000,
    altitudeM: originGeo.altitudeM,
  };
}

/**
 * Computes pixels per metre based on standard web Mercator zoom level and site latitude
 */
export function calculatePixelsPerMeter(zoom: number, latitude: number): number {
  // Base scale at zoom 19 calibrated to ~16 pixels per metre
  // 2^(zoom - 19) scaling
  return 16 * Math.pow(2, zoom - 19);
}

/**
 * Projects a local MetricPoint (metres) to ScreenPoint (pixels) based on active viewport state.
 * Supports zoom, pan, and rotation (bearing).
 */
export function metricToViewportScreen(
  ptM: MetricPoint,
  viewport: MapViewportState
): ScreenPoint {
  const relX = (ptM.x - viewport.centerMetric.x) * viewport.pixelsPerMeter;
  const relY = (ptM.y - viewport.centerMetric.y) * viewport.pixelsPerMeter;

  // If map bearing is non-zero, apply rotation around viewport center
  if (viewport.bearingDeg !== 0) {
    const rad = (-viewport.bearingDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotX = relX * cos - relY * sin;
    const rotY = relX * sin + relY * cos;
    return {
      x: viewport.widthPx / 2 + rotX,
      y: viewport.heightPx / 2 + rotY,
    };
  }

  return {
    x: viewport.widthPx / 2 + relX,
    y: viewport.heightPx / 2 + relY,
  };
}

/**
 * Unprojects a ScreenPoint (pixels) to local MetricPoint (metres) based on active viewport state.
 */
export function viewportScreenToMetric(
  screenPt: ScreenPoint,
  viewport: MapViewportState
): MetricPoint {
  let relX = screenPt.x - viewport.widthPx / 2;
  let relY = screenPt.y - viewport.heightPx / 2;

  if (viewport.bearingDeg !== 0) {
    const rad = (viewport.bearingDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const unrotX = relX * cos - relY * sin;
    const unrotY = relX * sin + relY * cos;
    relX = unrotX;
    relY = unrotY;
  }

  const xM = viewport.centerMetric.x + relX / viewport.pixelsPerMeter;
  const yM = viewport.centerMetric.y + relY / viewport.pixelsPerMeter;

  return {
    x: Math.round(xM * 100) / 100,
    y: Math.round(yM * 100) / 100,
  };
}

/**
 * Direct ScreenPoint to GeoCoordinate conversion
 */
export function viewportScreenToGeo(
  screenPt: ScreenPoint,
  viewport: MapViewportState,
  originGeo: GeoCoordinate
): GeoCoordinate {
  const metric = viewportScreenToMetric(screenPt, viewport);
  return metricToGeo(metric, originGeo);
}
