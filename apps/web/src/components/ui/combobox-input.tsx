"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent
} from "react";

interface ComboboxInputProps {
  value: string;
  options: readonly string[] | string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Label shown at bottom when typed value is not in the list */
  customEntryLabel?: string;
  /** Max items shown in the dropdown list */
  maxVisible?: number;
  id?: string;
  "aria-describedby"?: string;
}

export function ComboboxInput({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  required,
  className,
  customEntryLabel = "Əl ilə daxil edilir",
  maxVisible = 120,
  id,
  "aria-describedby": ariaDescribedBy
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceId = useId();
  const listId = `combobox-list-${instanceId}`;

  // Normalize for filtering
  const normalize = (s: string) => s.toLocaleLowerCase("az-AZ");

  const filtered = value.trim()
    ? options.filter((opt) =>
        normalize(opt).includes(normalize(value))
      ).slice(0, maxVisible)
    : [...options].slice(0, maxVisible);

  const exactMatch = options.some(
    (opt) => normalize(opt) === normalize(value)
  );
  const trimmed = value.trim();
  const showCustomHint = trimmed.length > 0 && !exactMatch;

  const selectOption = useCallback(
    (opt: string) => {
      onChange(opt);
      setOpen(false);
      setHighlighted(-1);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const acceptCustom = useCallback(() => {
    if (!trimmed) return;
    onChange(trimmed);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.blur();
  }, [onChange, trimmed]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || highlighted < 0) return;
    const list = listRef.current;
    const item = list?.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setHighlighted(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlighted((prev) => Math.max(prev - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && filtered[highlighted]) {
        selectOption(filtered[highlighted]);
      } else if (showCustomHint) {
        acceptCustom();
      } else if (value.trim()) {
        setOpen(false);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    } else if (e.key === "Tab") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && highlighted >= 0
              ? `${listId}-opt-${highlighted}`
              : undefined
          }
          aria-describedby={ariaDescribedBy}
          className={className}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => {
            setOpen(true);
            setHighlighted(0);
          }}
          onClick={() => {
            setOpen(true);
            setHighlighted(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {/* Chevron icon */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            if (open) {
              setOpen(false);
            } else {
              inputRef.current?.focus();
              setOpen(true);
              setHighlighted(0);
            }
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-600"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && !disabled && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 outline-none"
        >
          {filtered.length === 0 && !showCustomHint && (
            <li className="px-3 py-2.5 text-sm text-slate-400">
              Nəticə tapılmadı
            </li>
          )}
          {filtered.map((opt, idx) => (
            <li
              key={opt}
              id={`${listId}-opt-${idx}`}
              role="option"
              aria-selected={normalize(opt) === normalize(value)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              onMouseEnter={() => setHighlighted(idx)}
              className={`flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                idx === highlighted
                  ? "bg-[#0057FF] text-white"
                  : normalize(opt) === normalize(value)
                    ? "bg-[#0057FF]/8 font-medium text-[#0057FF]"
                    : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>{opt}</span>
              {normalize(opt) === normalize(value) && idx !== highlighted && (
                <svg className="h-4 w-4 shrink-0 text-[#0057FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          ))}
          {showCustomHint && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                acceptCustom();
              }}
              className="cursor-pointer border-t border-slate-100 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-[#0057FF]/8"
            >
              <span className="font-medium text-[#0057FF]">&ldquo;{trimmed}&rdquo;</span>
              <span className="text-slate-500"> — {customEntryLabel}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
