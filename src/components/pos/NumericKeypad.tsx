import { useState } from 'react';
import { X, Delete, ArrowLeft } from 'lucide-react';

interface NumericKeypadProps {
  onInput: (value: string) => void;
  onConfirm?: () => void;
  onClear?: () => void;
  onBack?: () => void;
  title?: string;
  showDecimal?: boolean;
  confirmLabel?: string;
}

function NumericKeypad({
  onInput,
  onConfirm,
  onClear,
  onBack,
  title,
  showDecimal = true,
  confirmLabel = 'Confirm',
}: NumericKeypadProps) {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    ...(showDecimal ? ['.'] : ['']),
    '0',
    'backspace',
  ];

  return (
    <div className="w-full">
      {title && (
        <div className="text-center text-sm text-[#a1a1aa] mb-2 font-medium">{title}</div>
      )}
      <div className="keypad-grid">
        {keys.map((key) => {
          if (key === '') {
            return <div key="empty" />;
          }
          if (key === 'backspace') {
            return (
              <button
                key="backspace"
                className="keypad-btn danger"
                onClick={() => {
                  const current = (document.activeElement as HTMLInputElement)?.value || '';
                  onInput(current.slice(0, -1));
                }}
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            );
          }
          return (
            <button
              key={key}
              className="keypad-btn"
              onClick={() => onInput(key)}
            >
              {key}
            </button>
          );
        })}
        <button
          className="keypad-btn wide action"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
      {onBack && (
        <button
          onClick={onBack}
          className="btn-secondary w-full mt-2 text-sm flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
    </div>
  );
}

export default NumericKeypad;