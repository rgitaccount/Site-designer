import React, { useRef } from 'react';
import { 
  ProjectInfo, 
  RoofPlane, 
  PanelPlacement, 
  DEFAULT_PANEL_MODEL,
  PIXELS_PER_METER,
  metricToScreen 
} from '../types/solar';
import { calculatePolygonAreaM2 } from '../utils/geometry';
import { SATELLITE_IMAGE_SRC } from '../assets/satellite';
import { 
  Sun, 
  Download, 
  Printer, 
  Compass, 
  Clock, 
  Info 
} from 'lucide-react';

interface ProposalTabProps {
  project: ProjectInfo;
  roofs: RoofPlane[];
  panels: PanelPlacement[];
  totalCapacityKwp: number;
}

export const ProposalTab: React.FC<ProposalTabProps> = ({
  project,
  roofs,
  panels,
  totalCapacityKwp,
}) => {
  const proposalRef = useRef<HTMLDivElement>(null);

  const totalPanels = panels.length;
  const totalRoofAreaM2 = roofs.reduce((sum, r) => sum + calculatePolygonAreaM2(r.polygonM), 0);
  const totalPanelAreaM2 = Math.round(totalPanels * (DEFAULT_PANEL_MODEL.widthM * DEFAULT_PANEL_MODEL.heightM) * 10) / 10;
  const overallUtilization = totalRoofAreaM2 > 0 ? Math.round((totalPanelAreaM2 / totalRoofAreaM2) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 h-full bg-slate-100 overflow-y-auto p-6 text-slate-800">
      {/* Top Toolbar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Commercial Proposal Document
          </span>
          <h1 className="text-lg font-bold text-slate-900">
            NurSun Solar EPC Proposal — {project.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Proposal</span>
          </button>
        </div>
      </div>

      {/* Formal Proposal Document (A4 sheet styling) */}
      <div
        ref={proposalRef}
        className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm p-8 space-y-6 text-xs leading-relaxed"
      >
        {/* Proposal Header & Branding */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
                <Sun className="w-4 h-4 text-amber-300 stroke-[2.5]" />
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight">
                NurSun Proposal Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Commercial & Industrial Photovoltaic Systems Engineering
            </p>
          </div>

          <div className="text-right text-[11px] font-mono">
            <div className="font-bold text-slate-900 text-xs">COMMERCIAL PROPOSAL</div>
            <div className="text-slate-500">Ref: NS-KG-2026-0926-01</div>
            <div className="text-slate-500">Date: {project.date}</div>
            <div className="text-blue-600 font-semibold">Status: Engineering Draft</div>
          </div>
        </div>

        {/* Project & Client Block */}
        <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Client Information</span>
            <div className="font-semibold text-slate-900">{project.client}</div>
            <div className="text-slate-600 mt-0.5">{project.location}</div>
            <div className="font-mono text-slate-500 text-[11px] mt-0.5">{project.coordinates}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">EPC General Contractor</span>
            <div className="font-semibold text-slate-900">NurSun Energy Kyrgyzstan LLC</div>
            <div className="text-slate-600 mt-0.5">Lead Solar Engineer: {project.engineer}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Commercial Solar Division</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
            1. Executive Engineering Summary
          </h2>
          <p className="text-slate-600">
            This preliminary commercial proposal outlines the photovoltaic system layout designed for <span className="font-semibold text-slate-900">{project.client}</span> at the <span className="font-semibold text-slate-900">{project.name}</span> facility. Based on manual geometric roof plane definition and direct module placement, the proposed PV plant comprises <span className="font-mono font-bold text-slate-900">{totalPanels} modules</span> delivering an installed peak DC capacity of <span className="font-mono font-bold text-blue-600">{totalCapacityKwp.toFixed(2)} kWp</span> across {roofs.length} independent roof planes.
          </p>
        </div>

        {/* Visual Site Plan Preview with Satellite Imagery and Overlay */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h2 className="text-sm font-bold text-slate-900">
              2. Engineered Site Plan & Photovoltaic Layout
            </h2>
            <span className="text-[10px] font-mono text-slate-500">True Satellite Overlay · Orthophoto Scale</span>
          </div>

          <div className="relative rounded border border-slate-300 overflow-hidden bg-slate-900 aspect-[16/9]">
            <img
              src={SATELLITE_IMAGE_SRC}
              alt="Engineered Solar Satellite Layout"
              className="w-full h-full object-cover"
            />

            {/* SVG Engineering Overlay rendered from metric coordinates */}
            <svg
              viewBox="0 0 1400 900"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Roof polygons */}
              {roofs.map((roof) => {
                const screenPoints = roof.polygonM.map(pM => metricToScreen(pM));
                return (
                  <g key={roof.id}>
                    <polygon
                      points={screenPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill={roof.color}
                      fillOpacity="0.25"
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

              {/* Placed PV Panels */}
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
                    strokeWidth="0.75"
                    rx="1"
                  />
                );
              })}
            </svg>

            {/* Title Block on Site Plan */}
            <div className="absolute bottom-2.5 right-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-white p-2.5 rounded font-mono text-[10px] space-y-0.5">
              <div className="font-bold text-blue-400 font-sans">{project.name} — PV SITE PLAN</div>
              <div>CAPACITY: <span className="font-bold text-white">{totalCapacityKwp.toFixed(2)} kWp</span></div>
              <div>MODULES: {totalPanels} × {DEFAULT_PANEL_MODEL.brand} {DEFAULT_PANEL_MODEL.powerWatts}W</div>
              <div>SCALE: 1:250 · POS: {project.coordinates}</div>
            </div>

            {/* North Arrow */}
            <div className="absolute top-2.5 left-2.5 bg-slate-900/85 border border-slate-700 text-white px-2 py-1 rounded flex items-center gap-1.5 text-[10px] font-mono">
              <Compass className="w-3.5 h-3.5 text-rose-500" />
              <span>N 0°</span>
            </div>
          </div>
        </div>

        {/* Roof-by-Roof Capacity Table (Source of truth: placed panel objects) */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
            3. Independent Roof Sub-Array Architecture
          </h2>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">Roof Plane</th>
                <th className="py-2.5 px-3">Azimuth</th>
                <th className="py-2.5 px-3">Tilt</th>
                <th className="py-2.5 px-3 text-right">Roof Area (m²)</th>
                <th className="py-2.5 px-3 text-right">Module Count</th>
                <th className="py-2.5 px-3 text-right">Module Rating</th>
                <th className="py-2.5 px-3 text-right">Installed Peak Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {roofs.map((roof) => {
                const rPanels = panels.filter((p) => p.roofId === roof.id);
                const rKwp = rPanels.reduce((s, p) => s + p.powerWatts, 0) / 1000;
                const rAreaM2 = calculatePolygonAreaM2(roof.polygonM);

                return (
                  <tr key={roof.id}>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: roof.color }} />
                      <span>{roof.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{roof.azimuthDeg}°</td>
                    <td className="py-2.5 px-3 text-slate-600">{roof.tiltDeg}°</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{rAreaM2.toFixed(1)} m²</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{rPanels.length} pcs</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{DEFAULT_PANEL_MODEL.powerWatts} W</td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-600">{rKwp.toFixed(2)} kWp</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/80 font-mono font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td className="py-2.5 px-3 font-sans" colSpan={3}>Total Placed Generator</td>
                <td className="py-2.5 px-3 text-right">{totalRoofAreaM2.toFixed(1)} m²</td>
                <td className="py-2.5 px-3 text-right">{totalPanels} pcs</td>
                <td className="py-2.5 px-3 text-right">—</td>
                <td className="py-2.5 px-3 text-right text-blue-600">{totalCapacityKwp.toFixed(2)} kWp</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Geometric Metrics (Genuinely derived from geometry) */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded border border-slate-200 font-mono text-center">
          <div>
            <span className="text-[10px] text-slate-500 font-sans block">Total Roof Area</span>
            <span className="text-sm font-bold text-slate-900">{totalRoofAreaM2.toFixed(1)} m²</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-sans block">Total Module Area</span>
            <span className="text-sm font-bold text-slate-900">{totalPanelAreaM2.toFixed(1)} m²</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-sans block">Roof Utilization</span>
            <span className="text-sm font-bold text-emerald-600">{overallUtilization}%</span>
          </div>
        </div>

        {/* Commercial & Production Section: Clearly marked as Backend Pending */}
        <div className="bg-slate-50 rounded border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-xs">
              4. Commercial Pricing & Simulation Status
            </span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              Backend Integration Required
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 font-mono pt-1">
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Turnkey EPC Price</span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Not calculated yet
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">PVGIS Year 1 Yield</span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Not calculated yet
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Annual Savings</span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Not calculated yet
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Simple Payback</span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Not calculated yet
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            Commercial equipment BOM pricing, PVGIS production modeling, and statutory taxes will be generated by the backend proposal pipeline.
          </p>
        </div>

        {/* Sign-off / Acceptance */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px]">
          <div>
            <span className="font-bold text-slate-900 block mb-1">Approved on behalf of Client:</span>
            <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1 text-slate-400">
              Signature & Corporate Stamp
            </div>
            <div className="text-slate-500 mt-1">Name: ____________________ Date: _________</div>
          </div>
          <div>
            <span className="font-bold text-slate-900 block mb-1">Submitted by NurSun Proposal Studio:</span>
            <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1 text-blue-700 font-serif italic text-sm">
              {project.engineer}
            </div>
            <div className="text-slate-500 mt-1">Solar PV Lead Engineer</div>
          </div>
        </div>
      </div>
    </div>
  );
};
