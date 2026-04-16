'use client';

import React from 'react';

export type LayoutMode = 'centered' | 'wide' | 'edge';

interface LayoutModeToggleProps {
  value: LayoutMode;
  onChange: (value: LayoutMode) => void;
}

const layoutOptions: Array<{ id: LayoutMode; label: string }> = [
  { id: 'centered', label: 'Centered' },
  { id: 'wide', label: 'Wide' },
  { id: 'edge', label: 'Edge' },
];

const LayoutModeToggle: React.FC<LayoutModeToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)]/60 p-1">
      <span className="px-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Layout
      </span>
      <div className="flex items-center gap-1">
        {layoutOptions.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              value === option.id
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
            aria-pressed={value === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayoutModeToggle;
