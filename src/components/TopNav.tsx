import React from 'react';
import { WorkflowStep, ProjectInfo } from '../types/solar';
import { 
  Sun, 
  MapPin, 
  Check, 
  Eye, 
  ArrowRight, 
  Save, 
  Layers, 
  Zap, 
  BarChart3, 
  DollarSign, 
  FileText 
} from 'lucide-react';

interface TopNavProps {
  currentStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
  project: ProjectInfo;
  totalPanels: number;
  totalCapacityKwp: number;
  onSave: () => void;
  onPreview: () => void;
  isSaved: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentStep,
  onSelectStep,
  project,
  totalPanels,
  totalCapacityKwp,
  onSave,
  onPreview,
  isSaved,
}) => {
  const steps: { id: WorkflowStep; label: string; icon: React.ElementType }[] = [
    { id: 'designer', label: 'Site Designer', icon: Layers },
    { id: 'system', label: 'PV System', icon: Zap },
    { id: 'production', label: 'Production', icon: BarChart3 },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'proposal', label: 'Proposal', icon: FileText },
  ];

  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  const handleContinue = () => {
    if (currentIdx < steps.length - 1) {
      onSelectStep(steps[currentIdx + 1].id);
    }
  };

  return (
    <header className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between select-none shrink-0 z-30 shadow-xs">
      {/* Zone 1: Brand & Project Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sun className="w-4 h-4 text-amber-300 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-slate-900 text-sm tracking-tight whitespace-nowrap">
            NurSun Proposal Studio
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400">Project:</span>
          <span className="font-medium text-slate-900">{project.name}</span>
          <span className="text-slate-400 font-mono text-[11px] tabular-nums hidden lg:inline">
            ({totalPanels} panels · {totalCapacityKwp.toFixed(2)} kWp)
          </span>
        </div>
      </div>

      {/* Zone 2: Workflow Steps Navigation */}
      <nav className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isPassed = idx < currentIdx;
          const StepIcon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : isPassed
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{step.label}</span>
              {isPassed && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
          title="Save project state"
        >
          <Save className="w-3.5 h-3.5 text-slate-500" />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
          title="Preview Site Plan and Proposal Sheet"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Preview</span>
        </button>

        {currentIdx < steps.length - 1 ? (
          <button
            onClick={handleContinue}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onSelectStep('designer')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors cursor-pointer"
          >
            <span>Edit Design</span>
          </button>
        )}
      </div>
    </header>
  );
};
