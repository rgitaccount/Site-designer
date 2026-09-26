import React from 'react';
import { ProjectInfo, PanelPlacement, DEFAULT_PANEL_MODEL } from '../types/solar';
import { DollarSign, Info, Clock, Receipt } from 'lucide-react';

interface PricingTabProps {
  project: ProjectInfo;
  panels: PanelPlacement[];
  totalCapacityKwp: number;
}

export const PricingTab: React.FC<PricingTabProps> = ({
  project,
  panels,
  totalCapacityKwp,
}) => {
  const totalPanels = panels.length;

  const bomCategories = [
    { name: 'PV Modules', spec: `${DEFAULT_PANEL_MODEL.brand} ${DEFAULT_PANEL_MODEL.model} (625W)`, quantity: `${totalPanels} pcs` },
    { name: 'Inverters & Power Conversion', spec: 'Sized to plant capacity', quantity: 'Pending sizing' },
    { name: 'Racking & Rooftop Mounting', spec: 'Aluminum rail & ballast structures', quantity: `${totalPanels} sets` },
    { name: 'Electrical Balance of System (BOS)', spec: '1000V DC cables, combiners, SPD, AC switchgear', quantity: 'Turnkey lot' },
    { name: 'Mechanical & Electrical Labor', spec: 'Certified EPC installation team', quantity: 'Turnkey lot' },
    { name: 'Engineering & Grid Interconnection', spec: 'CAD engineering, permitting, testing', quantity: '1 project' },
    { name: 'Applicable Taxes & Duties', spec: 'National VAT & import customs', quantity: 'Statutory' },
  ];

  return (
    <div className="flex-1 h-full bg-slate-50 overflow-y-auto p-6 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Commercial EPC Pricing & Equipment BOM
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Project: {project.name} · Client: {project.client} · Currency: {project.currency}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Commercial Status:</span>
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-mono">
              Pending Backend Quotation
            </span>
          </div>
        </div>

        {/* 4 Metric Cards: Genuine DC Geometry vs. Pending Backend Costing */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Installed Plant Capacity</div>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1 tabular-nums">
              {totalCapacityKwp.toFixed(2)} <span className="text-xs font-normal text-slate-500">kWp</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <span>●</span> {totalPanels} modules placed
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Turnkey EPC Capex</div>
            <div className="text-lg font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Not calculated yet</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Pending equipment procurement BOM
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Annual Electricity Savings</div>
            <div className="text-lg font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Not calculated yet</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Requires PVGIS yield + tariff data
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Simple Payback Period</div>
            <div className="text-lg font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Not calculated yet</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Awaiting Capex / savings ratio
            </div>
          </div>
        </div>

        {/* Itemized Equipment BOM & Scope Table */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Equipment Bill of Materials (BOM) & Turnkey Scope</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Quantities derived from CAD layout
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Item / Cost Category</th>
                  <th className="py-2.5 px-3">Specification / Brand</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (USD)</th>
                  <th className="py-2.5 px-3 text-right">Total Price (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {bomCategories.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{item.name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{item.spec}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                      Not calculated yet
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                      Not calculated yet
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 font-mono font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-sans" colSpan={2}>Turnkey Contract Total (incl. taxes)</td>
                  <td className="py-2.5 px-3 text-right">{totalPanels} modules</td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">—</td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-sans italic text-[11px]">
                    Pending backend pricing
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Backend Pipeline Notice */}
        <div className="bg-white rounded border border-slate-200 shadow-xs p-4 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">
              Commercial Quotation Service Notice
            </span>
            <p>
              Quantities for solar modules ({totalPanels} pcs) and mounting hardware are directly derived from the CAD roof layout. Itemized procurement costs, inverter pricing, electrical balance of system costs, labor rates, and local taxes will be calculated by the backend procurement and pricing engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
