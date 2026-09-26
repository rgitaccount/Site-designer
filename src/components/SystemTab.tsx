import React from 'react';
import { ProjectInfo, RoofPlane, PanelPlacement, PANEL_MODELS, DEFAULT_PANEL_MODEL } from '../types/solar';
import { calculatePolygonAreaM2 } from '../utils/geometry';
import { GitBranch, Cpu, Info, Clock } from 'lucide-react';

interface SystemTabProps {
  project: ProjectInfo;
  roofs: RoofPlane[];
  panels: PanelPlacement[];
  totalCapacityKwp: number;
}

export const SystemTab: React.FC<SystemTabProps> = ({
  project,
  roofs,
  panels,
  totalCapacityKwp,
}) => {
  const totalPanels = panels.length;

  return (
    <div className="flex-1 h-full bg-slate-50 overflow-y-auto p-6 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Photovoltaic Generator & Electrical System Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Project: {project.name} · Site Coordinates: {project.coordinates}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Total Placed DC Capacity:</span>
            <span className="font-mono font-bold text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded tabular-nums">
              {totalCapacityKwp.toFixed(2)} kWp
            </span>
          </div>
        </div>

        {/* 3 Metric Cards: Genuine DC Geometry vs. Backend Pending */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Total Placed Modules</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {totalPanels} <span className="text-xs font-normal text-slate-500">modules</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <span>●</span> Derived from CAD layout
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Installed DC Peak Capacity</div>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1 tabular-nums">
              {totalCapacityKwp.toFixed(2)} <span className="text-xs font-normal text-slate-500">kWp</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <span>●</span> Derived from placed modules × 625W
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Selected Inverter System</div>
            <div className="text-lg font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Not calculated yet</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Pending backend inverter matching
            </div>
          </div>
        </div>

        {/* Roof Sub-Arrays Electrical Architecture Table */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              <span>Independent Roof Sub-Arrays</span>
            </h2>
            <span className="text-xs text-slate-500">Geometry and DC capacity derived from placed modules</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Roof Plane</th>
                  <th className="py-2.5 px-3">Azimuth / Tilt</th>
                  <th className="py-2.5 px-3 text-right">Roof Area (m²)</th>
                  <th className="py-2.5 px-3 text-right">Placed Modules</th>
                  <th className="py-2.5 px-3 text-right">Module Rating</th>
                  <th className="py-2.5 px-3 text-right">Sub-Array DC (kWp)</th>
                  <th className="py-2.5 px-3 text-right">DC Stringing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {roofs.map((roof) => {
                  const rPanels = panels.filter((p) => p.roofId === roof.id);
                  const count = rPanels.length;
                  const kwp = rPanels.reduce((s, p) => s + p.powerWatts, 0) / 1000;
                  const roofAreaM2 = calculatePolygonAreaM2(roof.polygonM);
                  const model = PANEL_MODELS.find(m => m.id === roof.panelModelId) || DEFAULT_PANEL_MODEL;

                  return (
                    <tr key={roof.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: roof.color }} />
                        <span>{roof.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">
                        {roof.azimuthDeg}° / {roof.tiltDeg}°
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{roofAreaM2.toFixed(1)} m²</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{count}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{model.powerWatts} W</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600">{kwp.toFixed(2)} kWp</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                        Not calculated yet
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/80 font-mono font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-sans">Total PV Generator</td>
                  <td className="py-2.5 px-3">—</td>
                  <td className="py-2.5 px-3 text-right">
                    {roofs.reduce((sum, r) => sum + calculatePolygonAreaM2(r.polygonM), 0).toFixed(1)} m²
                  </td>
                  <td className="py-2.5 px-3 text-right">{totalPanels}</td>
                  <td className="py-2.5 px-3 text-right">—</td>
                  <td className="py-2.5 px-3 text-right text-blue-600">{totalCapacityKwp.toFixed(2)} kWp</td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                    Pending backend
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Backend Inverter & Electrical Service Card */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Inverter Selection & Stringing Architecture</span>
            </h2>
            <span className="text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              Backend Service Required
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-dashed border-slate-300 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 block">
                Inverter selection is not calculated yet
              </span>
              <p className="text-slate-500 leading-relaxed">
                The future backend service will calculate exact inverter sizing, manufacturer selection, MPPT tracking channel configuration, DC string lengths, and single-line diagrams (SLD) based on the current <span className="font-mono font-semibold text-slate-800">{totalCapacityKwp.toFixed(2)} kWp</span> placed capacity and local grid interconnection codes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
