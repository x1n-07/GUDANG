import React, { useState, useRef, useMemo, useEffect } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  options,
  placeholder = '',
  className = '',
  id,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on typed input
  const filteredOptions = useMemo(() => {
    const trimmed = (value || '').trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter(opt => opt.toLowerCase().includes(trimmed));
  }, [options, value]);

  // Candidates that strictly START WITH the typed text (for Tab completion)
  const prefixCandidates = useMemo(() => {
    const trimmed = (value || '').trim().toLowerCase();
    if (!trimmed) return [];
    return options.filter(opt => opt.toLowerCase().startsWith(trimmed));
  }, [options, value]);

  // Longest common prefix helper (case-insensitive, preserving canonical casing from first candidate)
  const getLongestCommonPrefix = (candidates: string[]): string => {
    if (candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0];

    let prefix = candidates[0].toLowerCase();
    for (let i = 1; i < candidates.length; i++) {
      const current = candidates[i].toLowerCase();
      let j = 0;
      while (j < prefix.length && j < current.length && prefix[j] === current[j]) {
        j++;
      }
      prefix = prefix.substring(0, j);
      if (j === 0) break;
    }
    // Return with casing from the first candidate
    return candidates[0].substring(0, prefix.length);
  };

  // Keep highlighted item in view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.autocomplete-item');
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setOpen(true);
    setHighlightedIndex(-1);
  };

  const selectOption = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    // UP / DOWN Arrow navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        if (filteredOptions.length > 0) setHighlightedIndex(0);
        return;
      }
      if (filteredOptions.length === 0) return;
      setHighlightedIndex(prev => (prev + 1 >= filteredOptions.length ? 0 : prev + 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        if (filteredOptions.length > 0) setHighlightedIndex(filteredOptions.length - 1);
        return;
      }
      if (filteredOptions.length === 0) return;
      setHighlightedIndex(prev => (prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1));
      return;
    }

    // ENTER key
    if (e.key === 'Enter') {
      if (open && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        selectOption(filteredOptions[highlightedIndex]);
        return;
      }
      // If no item is highlighted, allow normal form submission
      setOpen(false);
      return;
    }

    // TAB key (Option B: autocomplete)
    if (e.key === 'Tab' && !e.shiftKey) {
      // If an option is actively highlighted via arrow keys, select it
      if (open && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        selectOption(filteredOptions[highlightedIndex]);
        return;
      }

      const trimmed = (value || '').trim();
      if (!trimmed) return; // Tab moves focus normally if field is empty

      if (prefixCandidates.length === 1) {
        // Exactly 1 match: complete to it, keep focus
        if (prefixCandidates[0].toLowerCase() !== trimmed.toLowerCase()) {
          e.preventDefault();
          selectOption(prefixCandidates[0]);
          return;
        }
      } else if (prefixCandidates.length > 1) {
        // Multiple matches: complete to longest common prefix
        const lcp = getLongestCommonPrefix(prefixCandidates);
        if (lcp.length > trimmed.length) {
          e.preventDefault();
          onChange(lcp);
          setOpen(true);
          setHighlightedIndex(-1);
          return;
        }
      }
      // If no prefix match or exact match, let Tab move focus naturally
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        id={id}
        required={required}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (options.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay closing slightly to allow onMouseDown on options to fire
          setTimeout(() => setOpen(false), 200);
        }}
        className={className}
      />

      {open && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 divide-y divide-slate-100"
        >
          {filteredOptions.map((opt, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={opt}
                className={`autocomplete-item px-3.5 py-2 cursor-pointer text-sm transition-colors flex items-center justify-between ${
                  isHighlighted
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onMouseDown={e => {
                  e.preventDefault();
                  selectOption(opt);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <span>{opt}</span>
                {isHighlighted && (
                  <span className="text-[11px] text-blue-500 font-normal">↵ / Tab</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
