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
    if (yyyy.length === 4) {
      return `${dd.padStart(2, '0')}-${mm.padStart(2, '0')}-${yyyy}`;
    }
  }
  return isoStr;
}

// Converts various manual entries ('11062002', '11-06-2002', '11/06/2002', '11.06.2002', '2002-06-11') to 'yyyy-MM-dd'
export function displayToIso(displayStr: string): string {
  if (!displayStr) return '';

  const trimmed = displayStr.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 1. Handle 8 unformatted digits: DDMMYYYY (e.g. '11062002' -> '2002-06-11')
  if (digitsOnly.length === 8) {
    const dd = digitsOnly.slice(0, 2);
    const mm = digitsOnly.slice(2, 4);
    const yyyy = digitsOnly.slice(4, 8);
    const dayNum = parseInt(dd, 10);
    const monthNum = parseInt(mm, 10);
    const yearNum = parseInt(yyyy, 10);

    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
      const candidate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      if (isValid(parseISO(candidate))) return candidate;
    }
  }

  // 2. Handle delimiters: '-', '/', '.'
  const cleaned = trimmed.replace(/[\/\.]/g, '-');
  const parts = cleaned.split('-').filter(Boolean);

  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    // Format: DD-MM-YYYY
    if (p3.length === 4 && p1.length <= 2 && p2.length <= 2) {
      const dd = p1.padStart(2, '0');
      const mm = p2.padStart(2, '0');
      const yyyy = p3;
      const candidate = `${yyyy}-${mm}-${dd}`;
      if (isValid(parseISO(candidate))) return candidate;
    }
    // Format: YYYY-MM-DD
    if (p1.length === 4 && p2.length <= 2 && p3.length <= 2) {
      const yyyy = p1;
      const mm = p2.padStart(2, '0');
      const dd = p3.padStart(2, '0');
      const candidate = `${yyyy}-${mm}-${dd}`;
      if (isValid(parseISO(candidate))) return candidate;
    }
  }

  return '';
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

    const iso = displayToIso(raw);
    if (iso) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    const iso = displayToIso(displayText);
    if (iso) {
      onChange(iso);
      setDisplayText(isoToDisplay(iso));
    } else if (!displayText.trim()) {
      onChange('');
      setDisplayText('');
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

        {/* Hidden Native Picker Overlay Trigger - Excluded from Tab Order */}
        <input
          ref={datePickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
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
          tabIndex={-1}
          aria-hidden="true"
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
