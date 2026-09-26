import React from 'react';
import { ProjectInfo, RoofPlane, PanelPlacement } from '../types/solar';
import { calculatePolygonAreaM2 } from '../utils/geometry';
import { Sun, Info, TrendingUp, Clock, BarChart3 } from 'lucide-react';

interface ProductionTabProps {
  project: ProjectInfo;
  roofs: RoofPlane[];
  panels: PanelPlacement[];
  totalCapacityKwp: number;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  project,
  roofs,
  panels,
  totalCapacityKwp,
}) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="flex-1 h-full bg-slate-50 overflow-y-auto p-6 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Solar Energy Production Simulation (PVGIS)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Location: {project.location} ({project.coordinates}) · Target API: PVGIS / SARAH2
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Performance Ratio (PR):</span>
            <span className="font-mono text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
              Not calculated yet
            </span>
          </div>
        </div>

        {/* 3 Metric Cards: Genuine DC Geometry vs. Pending Backend Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Total Installed Capacity</div>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1 tabular-nums">
              {totalCapacityKwp.toFixed(2)} <span className="text-xs font-normal text-slate-500">kWp</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <span>●</span> Derived from {panels.length} placed modules
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Annual Energy Yield (Year 1)</div>
            <div className="text-lg font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Not calculated yet</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Awaiting backend PVGIS simulation
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Specific Solar Yield</div>
            <div className="text-lg font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Not calculated yet</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              kWh/kWp pending solar irradiance API
            </div>
          </div>
        </div>

        {/* Roof-by-Roof Geometry & Physical Orientation Table */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Roof Plane Orientation & Production Data</span>
            </h2>
            <span className="text-xs text-slate-500">Azimuth & tilt defined per roof</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Roof Plane</th>
                  <th className="py-2.5 px-3">Azimuth</th>
                  <th className="py-2.5 px-3">Tilt</th>
                  <th className="py-2.5 px-3 text-right">Roof Area (m²)</th>
                  <th className="py-2.5 px-3 text-right">Placed Modules</th>
                  <th className="py-2.5 px-3 text-right">Sub-Array DC</th>
                  <th className="py-2.5 px-3 text-right">Specific Yield</th>
                  <th className="py-2.5 px-3 text-right">Annual Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {roofs.map((roof) => {
                  const rPanels = panels.filter((p) => p.roofId === roof.id);
                  const count = rPanels.length;
                  const kwp = rPanels.reduce((s, p) => s + p.powerWatts, 0) / 1000;
                  const rAreaM2 = calculatePolygonAreaM2(roof.polygonM);

                  return (
                    <tr key={roof.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: roof.color }} />
                        <span>{roof.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{roof.azimuthDeg}°</td>
                      <td className="py-2.5 px-3 text-slate-600">{roof.tiltDeg}°</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{rAreaM2.toFixed(1)} m²</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600">{kwp.toFixed(2)} kWp</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                        Not calculated yet
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                        Not calculated yet
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/80 font-mono font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-sans" colSpan={3}>Total Plant Capacity</td>
                  <td className="py-2.5 px-3 text-right">
                    {roofs.reduce((sum, r) => sum + calculatePolygonAreaM2(r.polygonM), 0).toFixed(1)} m²
                  </td>
                  <td className="py-2.5 px-3 text-right">{panels.length}</td>
                  <td className="py-2.5 px-3 text-right text-blue-600">{totalCapacityKwp.toFixed(2)} kWp</td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">—</td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                    Pending PVGIS
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Monthly Projected Generation Chart Placeholder */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Monthly Solar Production Profile (kWh)</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              PVGIS simulation pending
            </span>
          </div>

          <div className="pt-4 pb-2">
            <div className="h-44 border border-dashed border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-300" />
              <div className="font-semibold text-xs text-slate-700">
                Monthly production profile is not calculated yet
              </div>
              <p className="text-[11px] text-slate-500 max-w-md">
                The backend service will query the PVGIS solar radiation API using site coordinates ({project.coordinates}) and the specific tilt and azimuth angles of each placed roof plane.
              </p>
            </div>
            {/* Monthly timeline labels */}
            <div className="flex justify-between px-4 mt-2">
              {months.map((m) => (
                <span key={m} className="text-[11px] font-mono text-slate-400">{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Backend Pipeline Notice */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-4 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">
              PVGIS Integration Notice
            </span>
            <p>
              Actual energy generation values are not hard-coded. Once connected to the PVGIS backend, production figures will be computed based on hourly meteorological data, horizon obstruction, angle of incidence, and temperature degradation coefficients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
