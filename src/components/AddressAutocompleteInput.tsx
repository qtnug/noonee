'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CiMapPin as MapPin,
  CiRedo as Loader2,
  CiCircleRemove as X,
  CiLocationArrow1 as Navigation,
} from 'react-icons/ci';
import { GoongPrediction, DistanceCalculationResult } from '@/lib/goong';
import { formatVND } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (address: string) => void;
  onDistanceCalculated?: (result: DistanceCalculationResult | null) => void;
  onCalculatingChange?: (isCalculating: boolean) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoCalculate?: boolean;
  branchId?: number;
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  onDistanceCalculated,
  onCalculatingChange,
  placeholder = 'Nhập số nhà, tên đường, phường/xã...',
  required = false,
  disabled = false,
  autoCalculate,
  branchId,
}: Props) {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<DistanceCalculationResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const calcDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUserTypingRef = useRef<boolean>(false);
  const lastCalculatedKeyRef = useRef<string>('');

  const onDistanceCalculatedRef = useRef(onDistanceCalculated);
  useEffect(() => {
    onDistanceCalculatedRef.current = onDistanceCalculated;
  });

  const onCalculatingChangeRef = useRef(onCalculatingChange);
  useEffect(() => {
    onCalculatingChangeRef.current = onCalculatingChange;
  });

  // Calculate distance helper
  const calculateDistance = async (params: { placeId?: string; address?: string }) => {
    if (!params.placeId && (!params.address || !params.address.trim())) {
      setDistanceInfo(null);
      if (onDistanceCalculatedRef.current) onDistanceCalculatedRef.current(null);
      return;
    }

    setIsCalculating(true);
    if (onCalculatingChangeRef.current) onCalculatingChangeRef.current(true);

    try {
      const res = await fetch('/api/goong/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, branchId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDistanceInfo(data.data);
        if (onDistanceCalculatedRef.current) {
          onDistanceCalculatedRef.current(data.data);
        }
      }
    } catch (err) {
      console.error('Error calculating distance:', err);
    } finally {
      setIsCalculating(false);
      if (onCalculatingChangeRef.current) onCalculatingChangeRef.current(false);
    }
  };

  // Sync internal input value with outer prop (when not typing)
  useEffect(() => {
    if (value !== inputValue && !isUserTypingRef.current) {
      setInputValue(value || '');
    }
  }, [value]);

  // Auto-calculate shipping distance on initial mount or when external address/branch prop arrives
  useEffect(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setDistanceInfo(null);
      lastCalculatedKeyRef.current = '';
      if (onDistanceCalculatedRef.current) onDistanceCalculatedRef.current(null);
      return;
    }

    const calcKey = `${trimmed}___${branchId ?? 'default'}`;
    if (calcKey === lastCalculatedKeyRef.current) {
      return; // Already calculated for this address & branch
    }

    const shouldAutoCalc = autoCalculate ?? Boolean(onDistanceCalculatedRef.current);
    if (
      shouldAutoCalc &&
      trimmed.length >= 3 &&
      !isUserTypingRef.current
    ) {
      lastCalculatedKeyRef.current = calcKey;
      calculateDistance({ address: trimmed });
    }
  }, [value, autoCalculate, branchId]);

  // Handle click outside to close dropdown & cleanup timers on unmount
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (calcDebounceTimerRef.current) {
        clearTimeout(calcDebounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch predictions when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTypingRef.current = true;
    const text = e.target.value;
    setInputValue(text);
    onChange(text);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (calcDebounceTimerRef.current) {
      clearTimeout(calcDebounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!text.trim() || text.trim().length < 2) {
      setPredictions([]);
      setIsSearching(false);
      setDistanceInfo(null);
      if (onDistanceCalculated) onDistanceCalculated(null);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const res = await fetch(`/api/goong/autocomplete?input=${encodeURIComponent(text.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
          setIsOpen(true);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching autocomplete:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);

    // If user types/pastes and stops typing for 1200ms without picking dropdown, auto-calculate
    const shouldAutoCalc = autoCalculate ?? Boolean(onDistanceCalculatedRef.current);
    if (shouldAutoCalc && text.trim().length >= 3) {
      calcDebounceTimerRef.current = setTimeout(() => {
        const trimmed = text.trim();
        const calcKey = `${trimmed}___${branchId ?? 'default'}`;
        if (calcKey !== lastCalculatedKeyRef.current) {
          lastCalculatedKeyRef.current = calcKey;
          calculateDistance({ address: trimmed });
        }
      }, 1200);
    }
  };

  const handleSelectPrediction = (p: GoongPrediction) => {
    isUserTypingRef.current = false;
    if (calcDebounceTimerRef.current) clearTimeout(calcDebounceTimerRef.current);
    const selected = p.description || p.main_text;
    const calcKey = `${selected.trim()}___${branchId ?? 'default'}`;
    lastCalculatedKeyRef.current = calcKey;
    setInputValue(selected);
    onChange(selected);
    setIsOpen(false);
    setPredictions([]);
    setSelectedIndex(-1);
    calculateDistance({ placeId: p.place_id, address: selected });
  };

  const handleClear = () => {
    isUserTypingRef.current = false;
    lastCalculatedKeyRef.current = '';
    if (calcDebounceTimerRef.current) clearTimeout(calcDebounceTimerRef.current);
    setInputValue('');
    onChange('');
    setPredictions([]);
    setIsOpen(false);
    setDistanceInfo(null);
    setSelectedIndex(-1);
    if (onDistanceCalculatedRef.current) onDistanceCalculatedRef.current(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        isUserTypingRef.current = false;
        if (calcDebounceTimerRef.current) clearTimeout(calcDebounceTimerRef.current);
        const trimmed = inputValue.trim();
        const calcKey = `${trimmed}___${branchId ?? 'default'}`;
        if (calcKey !== lastCalculatedKeyRef.current) {
          lastCalculatedKeyRef.current = calcKey;
          calculateDistance({ address: trimmed });
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < predictions.length) {
        handleSelectPrediction(predictions[selectedIndex]);
      } else {
        isUserTypingRef.current = false;
        if (calcDebounceTimerRef.current) clearTimeout(calcDebounceTimerRef.current);
        const trimmed = inputValue.trim();
        const calcKey = `${trimmed}___${branchId ?? 'default'}`;
        if (calcKey !== lastCalculatedKeyRef.current) {
          lastCalculatedKeyRef.current = calcKey;
          calculateDistance({ address: trimmed });
        }
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    isUserTypingRef.current = false;
    setTimeout(() => {
      const trimmed = inputValue.trim();
      const calcKey = `${trimmed}___${branchId ?? 'default'}`;
      if (trimmed && trimmed.length >= 3 && calcKey !== lastCalculatedKeyRef.current) {
        lastCalculatedKeyRef.current = calcKey;
        calculateDistance({ address: trimmed });
      }
    }, 250);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Input wrapper */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#A30029] pointer-events-none">
          <MapPin className="w-5 h-5" />
        </div>

        <input
          type="text"
          required={required}
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="address-predictions-list"
          className="w-full h-11 pl-11 pr-10 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition placeholder:text-gray-400"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {isSearching && <Loader2 className="w-4 h-4 text-[#A30029] animate-spin" />}

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Xóa"
              aria-label="Xóa địa chỉ"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div
          id="address-predictions-list"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#dddddd] rounded-[8px] shadow-lg max-h-64 overflow-y-auto divide-y divide-gray-100"
        >
          {predictions.map((p, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={p.place_id || idx}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectPrediction(p);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3.5 py-2.5 cursor-pointer flex items-start gap-2.5 text-left transition ${isSelected ? 'bg-[#fff1f2] text-[#A30029]' : 'hover:bg-gray-50 text-[#181d26]'
                  }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-full shrink-0 ${isSelected ? 'bg-[#A30029] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate">
                    {p.main_text || p.description}
                  </div>
                  {p.secondary_text && (
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">
                      {p.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calculating Indicator: compact */}
      {isCalculating && (
        <div className="flex items-center gap-2 text-[12px] text-gray-500 py-0.5">
          <Loader2 className="w-3.5 h-3.5 text-[#A30029] animate-spin" />
          <span>Đang tính khoảng cách & phí giao hàng...</span>
        </div>
      )}

      {/* Compact Distance & Fee Bar */}
      {distanceInfo && !isCalculating && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-3 py-2 rounded-[6px] text-[12px] border transition ${distanceInfo.isOutOfRange || distanceInfo.distanceKm > 15
            ? 'bg-[#fff1f2] border-[#fecdd3] text-[#A30029]'
            : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
        >
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[#A30029] shrink-0" />
            <span>
              Khoảng cách:{' '}
              <strong className={distanceInfo.isOutOfRange || distanceInfo.distanceKm > 15 ? 'text-[#A30029]' : 'text-[#181d26]'}>
                {distanceInfo.distanceText}
              </strong>
              {(distanceInfo.isOutOfRange || distanceInfo.distanceKm > 15) && (
                <span className="font-medium ml-1.5 text-[#A30029]">(Vượt quá bán kính 15km của quán)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {distanceInfo.isOutOfRange || distanceInfo.distanceKm > 15 ? (
              <span className="font-semibold text-[#A30029]">Chưa hỗ trợ giao</span>
            ) : (
              <>
                <span className="text-gray-500">Phí ship:</span>
                <span className="font-bold text-[#A30029]">{formatVND(distanceInfo.shippingFee)}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
