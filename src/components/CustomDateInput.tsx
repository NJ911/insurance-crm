'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

interface CustomDateInputProps {
  value: string; // ISO string 'yyyy-MM-dd' or empty
  onChange: (isoValue: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  min?: string;
  max?: string;
}

// Converts 'yyyy-MM-dd' to 'dd-MM-yyyy'
export function isoToDisplay(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}-${mm}-${yyyy}`;
  }
  return isoStr;
}

// Converts 'dd-MM-yyyy' or 'dd/MM/yyyy' to 'yyyy-MM-dd'
export function displayToIso(displayStr: string): string {
  if (!displayStr) return '';
  const cleaned = displayStr.replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (yyyy.length === 4 && mm.length <= 2 && dd.length <= 2) {
      const padMm = mm.padStart(2, '0');
      const padDd = dd.padStart(2, '0');
      const isoCandidate = `${yyyy}-${padMm}-${padDd}`;
      const parsed = parseISO(isoCandidate);
      if (isValid(parsed)) return isoCandidate;
    }
  }
  return displayStr;
}

export function CustomDateInput({
  value,
  onChange,
  label,
  required,
  error,
  min,
  max
}: CustomDateInputProps) {
  const [displayText, setDisplayText] = useState(isoToDisplay(value));
  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayText(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayText(raw);

    // If user types complete dd-MM-yyyy (e.g. 27-08-2026 or 27082026)
    const iso = displayToIso(raw);
    if (iso && iso.length === 10 && iso.split('-')[0].length === 4) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    const iso = displayToIso(displayText);
    if (iso && iso.length === 10 && iso.split('-')[0].length === 4) {
      onChange(iso);
      setDisplayText(isoToDisplay(iso));
    } else if (!displayText.trim()) {
      onChange('');
    }
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedIso = e.target.value; // 'yyyy-MM-dd'
    if (pickedIso) {
      onChange(pickedIso);
      setDisplayText(isoToDisplay(pickedIso));
    }
  };

  const openCalendar = () => {
    const el: any = datePickerRef.current;
    if (el) {
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker();
        } catch (err) {
          el.focus?.();
        }
      } else {
        el.focus?.();
      }
    }
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="DD-MM-YYYY"
          value={displayText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '0.55rem 2.25rem 0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: error ? '1px solid #ef4444' : '1px solid var(--border-strong)',
            background: 'var(--bg-input)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            outline: 'none',
            color: 'var(--text-primary)'
          }}
        />

        {/* Hidden Native Picker Overlay Trigger */}
        <input
          ref={datePickerRef}
          type="date"
          value={value || ''}
          min={min}
          max={max}
          onChange={handleNativePickerChange}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '32px',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2
          }}
        />

        <button
          type="button"
          onClick={openCalendar}
          style={{
            position: 'absolute',
            right: '0.6rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          <Calendar size={16} />
        </button>
      </div>

      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.15rem', display: 'block' }}>{error}</span>}
    </div>
  );
}
