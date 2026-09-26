import React from 'react';
import { 
  ProjectInfo, 
  RoofPlane, 
  PanelPlacement, 
  DEFAULT_PANEL_MODEL,
  PIXELS_PER_METER,
  metricToScreen 
} from '../types/solar';
import { SATELLITE_IMAGE_SRC } from '../assets/satellite';
import { X, Printer, Compass, Layers } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  roofs: RoofPlane[];
  panels: PanelPlacement[];
  totalCapacityKwp: number;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  roofs,
  panels,
  totalCapacityKwp,
}) => {
  if (!isOpen) return null;

  const totalPanels = panels.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden border border-slate-700">
        {/* Modal Header */}
        <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm">
              Engineering Site Plan Drawing Sheet — {project.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({totalPanels} Modules · {totalCapacityKwp.toFixed(2)} kWp)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / CAD Drawing Sheet Preview */}
        <div className="flex-1 bg-slate-800 p-6 overflow-auto flex items-center justify-center">
          <div className="w-[900px] h-[580px] bg-slate-950 border-2 border-slate-600 rounded relative shadow-2xl overflow-hidden flex flex-col">
            <div className="relative flex-1 w-full h-full overflow-hidden">
              <img
                src={SATELLITE_IMAGE_SRC}
                alt="Satellite Layout"
                className="w-full h-full object-cover"
              />

              <svg viewBox="0 0 1400 900" className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Roof polygons rendered from metric geometry */}
                {roofs.map((roof) => {
                  const screenPoints = roof.polygonM.map(pM => metricToScreen(pM));
                  return (
                    <g key={roof.id}>
                      <polygon
                        points={screenPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill={roof.color}
                        fillOpacity="0.22"
                        stroke={roof.color}
                        strokeWidth="2.5"
                      />
                      <polygon
                        points={screenPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={roof.color}
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    </g>
                  );
                })}

                {/* PV Panels from placed panel objects */}
                {panels.map((p) => {
                  const center = metricToScreen({ x: p.xM, y: p.yM });
                  const wPx = DEFAULT_PANEL_MODEL.widthM * PIXELS_PER_METER;
                  const hPx = DEFAULT_PANEL_MODEL.heightM * PIXELS_PER_METER;

                  return (
                    <rect
                      key={p.id}
                      x={center.x - wPx / 2}
                      y={center.y - hPx / 2}
                      width={wPx}
                      height={hPx}
                      transform={`rotate(${p.rotationDeg} ${center.x} ${center.y})`}
                      fill="#172554"
                      fillOpacity="0.95"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      rx="1"
                    />
                  );
                })}
              </svg>

              {/* North Arrow in Sheet */}
              <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 text-white px-2.5 py-1.5 rounded flex items-center gap-2 text-[10px] font-mono">
                <Compass className="w-4 h-4 text-rose-500" />
                <span>TRUE NORTH (0°)</span>
              </div>

              {/* Engineering Title Block */}
              <div className="absolute bottom-3 right-3 bg-slate-900/95 border-2 border-slate-600 text-white p-3 rounded font-mono text-[10px] w-80 space-y-1 shadow-lg">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="font-bold text-blue-400 font-sans text-xs">NURSUN PROPOSAL STUDIO</span>
                  <span className="text-slate-400">SHEET PV-01</span>
                </div>
                <div className="text-xs font-bold text-white font-sans">{project.name}</div>
                <div className="flex justify-between text-slate-300">
                  <span>Client:</span>
                  <span className="text-white font-medium">{project.client}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Installed DC Power:</span>
                  <span className="text-blue-400 font-bold">{totalCapacityKwp.toFixed(2)} kWp</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Placed Modules:</span>
                  <span className="text-white">{totalPanels} × {DEFAULT_PANEL_MODEL.powerWatts}W Jinko</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Location / Coords:</span>
                  <span className="text-slate-400">{project.coordinates}</span>
                </div>
                <div className="border-t border-slate-700 pt-1 text-[9px] text-slate-500 flex justify-between">
                  <span>SCALE: 1:250 @ A3</span>
                  <span>DATE: {project.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
