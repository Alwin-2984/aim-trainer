'use client';

import { Difficulty } from '@/engine/types';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
}

const LEVELS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  return (
    <div className="flex gap-2.5 justify-center my-6">
      {LEVELS.map((lvl) => (
        <button
          key={lvl.value}
          className={`px-6 py-2 rounded-lg border-2 font-semibold uppercase tracking-wider transition-all duration-250 text-[0.85rem] cursor-pointer ${
            selected === lvl.value
              ? 'border-[#ff8c00] bg-linear-to-br from-[#ff8c00]/25 to-[#ff8c00]/10 text-white shadow-[0_0_16px_rgba(255,140,0,0.3)]'
              : 'border-white/15 bg-white/5 text-white/70 hover:border-[#ff8c00]/50 hover:text-white hover:bg-[#ff8c00]/10'
          }`}
          onClick={() => onSelect(lvl.value)}
        >
          {lvl.label}
        </button>
      ))}
    </div>
  );
}
