import { 
  MetricPoint, 
  PanelPlacement, 
  Obstacle, 
  PanelModel 
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
