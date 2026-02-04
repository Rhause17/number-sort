// ToolPalette.tsx - Piece value palette

import { getColorForValue } from '../utils/colors';

interface ToolPaletteProps {
  selectedValue: number | null;
  onSelectValue: (value: number) => void;
}

const PIECE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

export function ToolPalette({ selectedValue, onSelectValue }: ToolPaletteProps) {
  return (
    <div className="bg-slate-800 p-3 rounded-lg">
      <h3 className="text-xs font-semibold text-slate-400 mb-2">Piece Values</h3>
      <div className="flex flex-wrap gap-1">
        {PIECE_VALUES.map((value) => {
          const color = getColorForValue(value);
          const isSelected = selectedValue === value;

          return (
            <button
              key={value}
              onClick={() => onSelectValue(value)}
              className={`
                w-10 h-10 rounded font-bold text-xs flex items-center justify-center
                transition-all
                ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-105'}
              `}
              style={{
                backgroundColor: color,
                color: value >= 64 ? '#fff' : '#1e293b',
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Click a tube slot to add, right-click to remove
      </p>
    </div>
  );
}
