import { 
  MetricPoint, 
  PanelPlacement, 
  Obstacle, 
  PanelModel,
  PANEL_MODELS,
  DEFAULT_PANEL_MODEL
} from '../types/solar';

/**
 * Calculates area of polygon in square metres using Shoelace formula
 * Input points must be in metric coordinates (metres).
 */
export function calculatePolygonAreaM2(pointsM: MetricPoint[]): number {
  if (pointsM.length < 3) return 0;
  let area = 0;
  const n = pointsM.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pointsM[i].x * pointsM[j].y;
    area -= pointsM[j].x * pointsM[i].y;
  }
  const areaM2 = Math.abs(area) / 2;
  return Math.round(areaM2 * 10) / 10;
}

/**
 * Checks if point is inside a polygon using ray-casting
 * Coordinates in metres.
 */
export function isPointInPolygon(point: MetricPoint, vs: MetricPoint[]): boolean {
  const x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates distance from point to a line segment in metres
 */
function distToSegmentSquared(p: MetricPoint, v: MetricPoint, w: MetricPoint): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) * (p.x - (v.x + t * (w.x - v.x))) +
         (p.y - (v.y + t * (w.y - v.y))) * (p.y - (v.y + t * (w.y - v.y)));
}

/**
 * Calculates shortest distance from point to polygon boundary in metres
 */
export function distToPolygonBoundaryM(p: MetricPoint, vs: MetricPoint[]): number {
  let minD2 = Infinity;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const d2 = distToSegmentSquared(p, vs[i], vs[j]);
    if (d2 < minD2) minD2 = d2;
  }
  return Math.sqrt(minD2);
}

/**
 * Euclidean distance between two metric points in metres
 */
export function distanceInMeters(p1: MetricPoint, p2: MetricPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
}

/**
 * Gets bounding box of polygon in metres
 */
export function getPolygonBoundsM(pointsM: MetricPoint[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pointsM) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Rotates a point around origin in 2D metric space
 */
function rotatePoint(p: MetricPoint, origin: MetricPoint, angleDeg: number): MetricPoint {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/**
 * Generates automated panel grid inside roof polygon using metric geometry.
 * Symmetrically centers the array inside the usable roof area,
 * strictly enforces edge setback in metres, clears obstacles, and respects panel model dimensions.
 */
export function generatePanelsForRoof(
  roofId: string,
  polygonM: MetricPoint[],
  panelModel: PanelModel,
  orientation: 'portrait' | 'landscape',
  edgeSetbackM: number,
  visualRotationDeg: number = 0,
  obstacles: Obstacle[] = []
): PanelPlacement[] {
  if (polygonM.length < 3) return [];

  // Physical dimensions from panel model in metres
  const wM = orientation === 'portrait' ? panelModel.widthM : panelModel.heightM;
  const hM = orientation === 'portrait' ? panelModel.heightM : panelModel.widthM;

  // Inter-module spacing in metres (3cm clamp gap, 25cm row maintenance walkway)
  const gapXM = 0.04;
  const gapYM = 0.25;

  const stepX = wM + gapXM;
  const stepY = hM + gapYM;

  const bounds = getPolygonBoundsM(polygonM);
  const centerM: MetricPoint = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };

  // Rotate polygon into grid coordinate space to simplify rectangular tiling
  const unrotatedPoly = polygonM.map(p => rotatePoint(p, centerM, -visualRotationDeg));
  const unrotBounds = getPolygonBoundsM(unrotatedPoly);

  const usableWidthM = (unrotBounds.maxX - edgeSetbackM) - (unrotBounds.minX + edgeSetbackM);
  const usableHeightM = (unrotBounds.maxY - edgeSetbackM) - (unrotBounds.minY + edgeSetbackM);

  if (usableWidthM < wM || usableHeightM < hM) return [];

  const numCols = Math.max(1, Math.floor((usableWidthM + gapXM) / stepX));
  const numRows = Math.max(1, Math.floor((usableHeightM + gapYM) / stepY));

  const totalGridWidthM = numCols * stepX - gapXM;
  const totalGridHeightM = numRows * stepY - gapYM;

  // Center the grid symmetrically within the setback-adjusted roof plane
  const startX = unrotBounds.minX + edgeSetbackM + Math.max(0, (usableWidthM - totalGridWidthM) / 2);
  const startY = unrotBounds.minY + edgeSetbackM + Math.max(0, (usableHeightM - totalGridHeightM) / 2);

  const panels: PanelPlacement[] = [];

  for (let r = 0; r < numRows; r++) {
    const y = startY + r * stepY;
    for (let c = 0; c < numCols; c++) {
      const x = startX + c * stepX;

      const panelCenterUnrot: MetricPoint = {
        x: x + wM / 2,
        y: y + hM / 2,
      };

      // 4 corners of candidate panel in unrotated metric space
      const cornersUnrot: MetricPoint[] = [
        { x, y },
        { x: x + wM, y },
        { x: x + wM, y: y + hM },
        { x, y: y + hM },
      ];

      // Rotate corners and center back to roof metric space
      const cornersRot = cornersUnrot.map(p => rotatePoint(p, centerM, visualRotationDeg));
      const panelCenterRot = rotatePoint(panelCenterUnrot, centerM, visualRotationDeg);

      // Check all 4 corners and center are inside polygon and satisfy setback
      let valid = true;
      for (const corner of cornersRot) {
        if (!isPointInPolygon(corner, polygonM)) {
          valid = false;
          break;
        }
        if (distToPolygonBoundaryM(corner, polygonM) < edgeSetbackM * 0.95) {
          valid = false;
          break;
        }
      }

      if (valid && !isPointInPolygon(panelCenterRot, polygonM)) {
        valid = false;
      }

      // Check obstacle clearance
      if (valid) {
        for (const obs of obstacles) {
          const obsMinX = obs.xM - obs.widthM / 2;
          const obsMaxX = obs.xM + obs.widthM / 2;
          const obsMinY = obs.yM - obs.heightM / 2;
          const obsMaxY = obs.yM + obs.heightM / 2;

          const panelMinX = panelCenterRot.x - wM / 2;
          const panelMaxX = panelCenterRot.x + wM / 2;
          const panelMinY = panelCenterRot.y - hM / 2;
          const panelMaxY = panelCenterRot.y + hM / 2;

          if (
            panelMinX < obsMaxX &&
            panelMaxX > obsMinX &&
            panelMinY < obsMaxY &&
            panelMaxY > obsMinY
          ) {
            valid = false;
            break;
          }
        }
      }

      if (valid) {
        panels.push({
          id: `p-${roofId}-${r}-${c}-${Math.random().toString(36).substring(2, 6)}`,
          roofId,
          xM: Math.round(panelCenterRot.x * 100) / 100,
          yM: Math.round(panelCenterRot.y * 100) / 100,
          rotationDeg: visualRotationDeg,
          orientation,
          panelModelId: panelModel.id,
          powerWatts: panelModel.powerWatts,
          row: r,
          col: c,
        });
      }
    }
  }

  return panels;
}

/**
 * Computes effective rotation angle in degrees (0, 90, 180, 270)
 * considering both orientation and rotationDeg.
 */
export function getEffectivePanelAngle(panel: {
  rotationDeg: number;
  orientation: 'portrait' | 'landscape';
}): number {
  if (panel.orientation === 'landscape' && panel.rotationDeg % 180 === 0) {
    return (panel.rotationDeg + 90) % 360;
  }
  return (panel.rotationDeg % 360 + 360) % 360;
}

/**
 * Computes the 4 corners in metric coordinates of a panel footprint
 * using its actual physical model dimensions and rotation angle.
 */
export function getPanelFootprintCornersM(panel: {
  xM: number;
  yM: number;
  rotationDeg: number;
  orientation: 'portrait' | 'landscape';
  panelModelId?: string;
}): MetricPoint[] {
  const model = PANEL_MODELS.find(m => m.id === panel.panelModelId) || DEFAULT_PANEL_MODEL;
  const baseW = model.widthM;
  const baseH = model.heightM;
  const center: MetricPoint = { x: panel.xM, y: panel.yM };

  const effectiveAngle = getEffectivePanelAngle(panel);

  const unrotCorners: MetricPoint[] = [
    { x: panel.xM - baseW / 2, y: panel.yM - baseH / 2 },
    { x: panel.xM + baseW / 2, y: panel.yM - baseH / 2 },
    { x: panel.xM + baseW / 2, y: panel.yM + baseH / 2 },
    { x: panel.xM - baseW / 2, y: panel.yM + baseH / 2 },
  ];

  if (effectiveAngle === 0) {
    return unrotCorners;
  }

  return unrotCorners.map(corner => rotatePoint(corner, center, effectiveAngle));
}

/**
 * Checks if two 2D line segments (p1-p2) and (p3-p4) intersect
 */
function doSegmentsIntersect(p1: MetricPoint, p2: MetricPoint, p3: MetricPoint, p4: MetricPoint): boolean {
  const ccw = (a: MetricPoint, b: MetricPoint, c: MetricPoint) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  };
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

/**
 * Separating Axis Theorem (SAT) to detect intersection between two convex polygons
 */
export function doPolygonsIntersectSAT(polyA: MetricPoint[], polyB: MetricPoint[]): boolean {
  const polygons = [polyA, polyB];

  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      // Normal axis perpendicular to edge (p1 -> p2)
      const normalAxis: MetricPoint = {
        x: -(p2.y - p1.y),
        y: p2.x - p1.x,
      };

      // Project polyA onto normalAxis
      let minA = Infinity;
      let maxA = -Infinity;
      for (const p of polyA) {
        const projected = p.x * normalAxis.x + p.y * normalAxis.y;
        if (projected < minA) minA = projected;
        if (projected > maxA) maxA = projected;
      }

      // Project polyB onto normalAxis
      let minB = Infinity;
      let maxB = -Infinity;
      for (const p of polyB) {
        const projected = p.x * normalAxis.x + p.y * normalAxis.y;
        if (projected < minB) minB = projected;
        if (projected > maxB) maxB = projected;
      }

      // Check if projections overlap with slight tolerance (1mm)
      if (maxA <= minB + 0.001 || maxB <= minA + 0.001) {
        // Found a separating axis, polygons do not intersect!
        return false;
      }
    }
  }

  return true;
}

export type ValidationFailureReason = 'outside_roof' | 'setback_violation' | 'obstacle_collision';

export interface PanelValidationResult {
  valid: boolean;
  reason?: ValidationFailureReason;
  message?: string;
}

/**
 * Validates a panel footprint against:
 * 1. Complete rectangular footprint is inside the roof polygon
 * 2. Panel respects the roof edge setback in real metres
 * 3. Panel does not intersect obstacles belonging to that roof
 * 4. Uses actual physical dimensions of the panel model
 */
export function validatePanelFootprint(
  panel: {
    xM: number;
    yM: number;
    rotationDeg: number;
    orientation: 'portrait' | 'landscape';
    panelModelId?: string;
  },
  polygonM: MetricPoint[],
  edgeSetbackM: number,
  obstacles: Obstacle[] = []
): PanelValidationResult {
  if (polygonM.length < 3) {
    return { valid: false, reason: 'outside_roof', message: 'Invalid roof geometry' };
  }

  const corners = getPanelFootprintCornersM(panel);
  const center: MetricPoint = { x: panel.xM, y: panel.yM };

  // 1. Check center point is inside the roof polygon
  if (!isPointInPolygon(center, polygonM)) {
    return { valid: false, reason: 'outside_roof', message: 'Panel center is outside the roof boundary' };
  }

  // 2. Check all 4 corners are inside the roof polygon
  for (const corner of corners) {
    if (!isPointInPolygon(corner, polygonM)) {
      return { valid: false, reason: 'outside_roof', message: 'Panel extends outside the roof boundary' };
    }
  }

  // 3. Check 4 edge midpoints to guard against polygon concave edge clipping
  for (let i = 0; i < 4; i++) {
    const nextIdx = (i + 1) % 4;
    const midPoint: MetricPoint = {
      x: (corners[i].x + corners[nextIdx].x) / 2,
      y: (corners[i].y + corners[nextIdx].y) / 2,
    };
    if (!isPointInPolygon(midPoint, polygonM)) {
      return { valid: false, reason: 'outside_roof', message: 'Panel edge cuts outside the roof boundary' };
    }
  }

  // 4. Check if panel edges intersect the roof polygon perimeter
  const nPoly = polygonM.length;
  for (let pi = 0; pi < nPoly; pi++) {
    const pj = (pi + 1) % nPoly;
    const polyP1 = polygonM[pi];
    const polyP2 = polygonM[pj];

    for (let ci = 0; ci < 4; ci++) {
      const cj = (ci + 1) % 4;
      if (doSegmentsIntersect(corners[ci], corners[cj], polyP1, polyP2)) {
        return { valid: false, reason: 'outside_roof', message: 'Panel crosses the roof perimeter' };
      }
    }
  }

  // 5. Check edge setback (all corners and edges must maintain required setback distance)
  const minRequiredDistance = edgeSetbackM * 0.98;
  for (const corner of corners) {
    if (distToPolygonBoundaryM(corner, polygonM) < minRequiredDistance) {
      return { valid: false, reason: 'setback_violation', message: `Panel violates the ${edgeSetbackM.toFixed(2)}m edge setback` };
    }
  }

  for (let i = 0; i < 4; i++) {
    const nextIdx = (i + 1) % 4;
    const midPoint: MetricPoint = {
      x: (corners[i].x + corners[nextIdx].x) / 2,
      y: (corners[i].y + corners[nextIdx].y) / 2,
    };
    if (distToPolygonBoundaryM(midPoint, polygonM) < minRequiredDistance) {
      return { valid: false, reason: 'setback_violation', message: `Panel violates the ${edgeSetbackM.toFixed(2)}m edge setback` };
    }
  }

  // 6. Check collision with obstacles using Separating Axis Theorem (SAT)
  for (const obs of obstacles) {
    const obsCorners: MetricPoint[] = [
      { x: obs.xM - obs.widthM / 2, y: obs.yM - obs.heightM / 2 },
      { x: obs.xM + obs.widthM / 2, y: obs.yM - obs.heightM / 2 },
      { x: obs.xM + obs.widthM / 2, y: obs.yM + obs.heightM / 2 },
      { x: obs.xM - obs.widthM / 2, y: obs.yM + obs.heightM / 2 },
    ];

    if (doPolygonsIntersectSAT(corners, obsCorners)) {
      return { valid: false, reason: 'obstacle_collision', message: `Panel intersects obstacle: ${obs.name}` };
    }
  }

  return { valid: true };
}
