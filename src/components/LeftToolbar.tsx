import React from 'react';
import { ActiveTool } from '../types/solar';
import { 
  MousePointer, 
  PenTool, 
  Grid3X3, 
  ShieldAlert, 
  Ruler, 
  Hand, 
  RotateCw,
  Trash2,
  Plus
} from 'lucide-react';

interface LeftToolbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  selectedPanelCount: number;
  onDeleteSelectedPanels: () => void;
  onRotateSelectedPanels: () => void;
  onAddPanelManual: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  selectedPanelCount,
  onDeleteSelectedPanels,
  onRotateSelectedPanels,
  onAddPanelManual,
}) => {
  const tools: { id: ActiveTool; label: string; shortcut: string; icon: React.ElementType; description: string }[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: MousePointer,
      description: 'Select and move roof planes or individual panels',
    },
    {
      id: 'draw-roof',
      label: 'Draw Roof',
      shortcut: 'R',
      icon: PenTool,
      description: 'Click points on satellite map to draw a usable roof polygon',
    },
    {
      id: 'panels',
      label: 'Panels',
      shortcut: 'P',
      icon: Grid3X3,
      description: 'Place, fill, or manipulate PV modules inside roof',
    },
    {
      id: 'obstacle',
      label: 'Obstacle',
      shortcut: 'O',
      icon: ShieldAlert,
      description: 'Draw HVAC / skylight keep-out zones to avoid shade',
    },
    {
      id: 'measure',
      label: 'Measure',
      shortcut: 'M',
      icon: Ruler,
      description: 'Measure distance between points in meters',
    },
    {
      id: 'pan',
      label: 'Pan',
      shortcut: 'H',
      icon: Hand,
      description: 'Pan and navigate across the satellite canvas',
    },
  ];

  return (
    <aside className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-3 select-none shrink-0 z-20 shadow-xs justify-between">
      {/* Primary CAD tools */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          const ToolIcon = tool.icon;

          return (
            <div key={tool.id} className="relative group w-full flex justify-center">
              <button
                onClick={() => onSelectTool(tool.id)}
                className={`w-10 h-10 rounded flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
                aria-label={tool.label}
              >
                <ToolIcon className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Engineering Tooltip */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{tool.label}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1 rounded">
                    {tool.shortcut}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 mt-0.5">{tool.description}</span>
              </div>
            </div>
          );
        })}

        {/* Divider */}
        <div className="w-8 h-px bg-slate-200 my-2" />

        {/* Quick Context Panel Actions (when panels are selected) */}
        {selectedPanelCount > 0 ? (
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="relative group w-full flex justify-center">
              <button
                onClick={onRotateSelectedPanels}
                className="w-10 h-10 rounded flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                title="Rotate selected panels 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                Rotate 90°
              </div>
            </div>

            <div className="relative group w-full flex justify-center">
              <button
                onClick={onDeleteSelectedPanels}
                className="w-10 h-10 rounded flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Delete selected panels"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                Delete {selectedPanelCount} panel{selectedPanelCount > 1 ? 's' : ''} (Del)
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group w-full flex justify-center">
            <button
              onClick={onAddPanelManual}
              className="w-10 h-10 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-dashed border-slate-300 transition-colors cursor-pointer"
              title="Add individual panel"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
              Place single panel
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-[10px] font-mono text-slate-400 text-center uppercase tracking-wider px-1">
        CAD
      </div>
    </aside>
  );
};
