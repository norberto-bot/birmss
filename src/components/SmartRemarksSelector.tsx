import React from 'react';
import { SMART_REMARKS_OPTIONS } from '../data/initialData';
import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SmartRemarksSelectorProps {
  selectedNotes: string[];
  onChangeNotes: (notes: string[]) => void;
  customText: string;
  onChangeCustomText: (text: string) => void;
}

export const SmartRemarksSelector: React.FC<SmartRemarksSelectorProps> = ({
  selectedNotes,
  onChangeNotes,
  customText,
  onChangeCustomText,
}) => {
  const { language } = useApp();

  const toggleOption = (opt: string) => {
    if (selectedNotes.includes(opt)) {
      onChangeNotes(selectedNotes.filter((n) => n !== opt));
    } else {
      onChangeNotes([...selectedNotes, opt]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-slate-700 font-semibold text-xs">
          {language === 'fil' ? 'Smart Remarks / Tala (I-tap ang mga akmang dahilan):' : 'Smart Remarks / Clinical Observations (Tap to select):'}
        </label>
        <span className="text-[11px] text-slate-500">
          {selectedNotes.length > 0 ? `${selectedNotes.length} selected` : 'Quick choices'}
        </span>
      </div>

      {/* Clickable Quick Choice Chips */}
      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
        {SMART_REMARKS_OPTIONS.map((opt) => {
          const isSelected = selectedNotes.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none text-left min-h-[36px] ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Optional Free-Text Add-on */}
      <div>
        <input
          type="text"
          placeholder={language === 'fil' ? 'Karagdagang sariling tala (opsyonal)...' : 'Additional custom notes or remarks (optional)...'}
          value={customText}
          onChange={(e) => onChangeCustomText(e.target.value)}
          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white focus:bg-slate-50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </div>
  );
};
