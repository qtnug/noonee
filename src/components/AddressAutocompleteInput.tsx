'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Loader2,
  X,
  Navigation,
  Clock,
  Bike,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { GoongPrediction, DistanceCalculationResult, STORE_ADDRESS } from '@/lib/goong';
import { formatVND } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (address: string) => void;
  onDistanceCalculated?: (result: DistanceCalculationResult) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const QUICK_PLACES = [
  { label: 'Gần quán (Yên Lãng)', query: '120 Phố Yên Lãng, Đống Đa' },
  { label: 'ĐH Thủy Lợi (Tây Sơn)', query: 'Đại học Thủy Lợi, 175 Tây Sơn' },
  { label: 'Royal City (Nguyễn Trãi)', query: 'Royal City, 72A Nguyễn Trãi' },
  { label: 'Keangnam 72 (Phạm Hùng)', query: 'Keangnam Landmark 72, Phạm Hùng' },
  { label: 'Bách Khoa (Đại Cồ Việt)', query: 'Đại học Bách Khoa Hà Nội' },
];

export default function AddressAutocompleteInput({
  value,
  onChange,
  onDistanceCalculated,
  placeholder = 'Nhập số nhà, tên đường, phường/xã (VD: 120 Yên Lãng, Đống Đa)...',
  required = false,
  disabled = false,
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

  // Sync internal input value with outer prop
  useEffect(() => {
    if (value !== inputValue && !isOpen) {
      setInputValue(value || '');
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch predictions when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/goong/autocomplete?input=${encodeURIComponent(text.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Error fetching autocomplete:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  // Calculate distance from 120 Yên Lãng
  const calculateDistance = async (params: { placeId?: string; address?: string }) => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/goong/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDistanceInfo(data.data);
        if (onDistanceCalculated) {
          onDistanceCalculated(data.data);
        }
      }
    } catch (err) {
      console.error('Error calculating distance:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // When user selects a prediction from the dropdown
  const handleSelectPrediction = (item: GoongPrediction) => {
    const selectedText = item.description || item.main_text;
    setInputValue(selectedText);
    onChange(selectedText);
    setIsOpen(false);
    setPredictions([]);
    calculateDistance({
      placeId: item.place_id,
      address: selectedText,
    });
  };

  // When user clicks a quick suggestion chip
  const handleSelectQuickPlace = (chip: { label: string; query: string }) => {
    setInputValue(chip.query);
    onChange(chip.query);
    setIsOpen(false);
    calculateDistance({ address: chip.query });
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setPredictions([]);
    setDistanceInfo(null);
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        calculateDistance({ address: inputValue.trim() });
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
        calculateDistance({ address: inputValue.trim() });
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    // If user typed an address manually and hasn't calculated yet
    if (inputValue.trim() && !distanceInfo && !isCalculating) {
      setTimeout(() => {
        calculateDistance({ address: inputValue.trim() });
      }, 350);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2.5">
      {/* Input wrapper */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#e31837] pointer-events-none">
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
          className="w-full h-12 pl-11 pr-20 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[8px] focus:outline-none focus:border-[#e31837] focus:ring-2 focus:ring-[#e31837]/15 transition placeholder:text-gray-400"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {isSearching && <Loader2 className="w-4 h-4 text-[#e31837] animate-spin" />}

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Xóa địa chỉ"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div
            className="hidden sm:flex items-center text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"
            title="Được hỗ trợ bởi Goong Maps"
          >
            Goong
          </div>
        </div>
      </div>

      {/* Autocomplete Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#dddddd] rounded-[10px] shadow-lg max-h-72 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3.5 py-2 bg-gray-50/80 text-[11px] font-medium text-[#41454d] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#e31837]" />
              Gợi ý địa chỉ từ Goong Maps (Hà Nội)
            </span>
            <span className="text-[10px] text-gray-400">Chọn để tính khoảng cách</span>
          </div>

          {predictions.map((p, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={p.place_id || idx}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  handleSelectPrediction(p);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3.5 py-2.5 cursor-pointer flex items-start gap-3 text-left transition ${
                  isSelected ? 'bg-[#fff1f2] text-[#e31837]' : 'hover:bg-gray-50 text-[#181d26]'
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-full shrink-0 ${
                    isSelected ? 'bg-[#e31837] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">
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

      {/* Quick Select Chips */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[11px] text-[#9297a0] font-medium flex items-center gap-1 shrink-0">
          <Navigation className="w-3 h-3 text-[#e31837]" />
          Gợi ý nhanh:
        </span>
        {QUICK_PLACES.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleSelectQuickPlace(chip)}
            className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-[#fff1f2] text-[#41454d] hover:text-[#e31837] border border-gray-200 hover:border-[#fecdd3] transition whitespace-nowrap"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Calculating Indicator */}
      {isCalculating && (
        <div className="p-3 bg-[#f8fafc] border border-gray-200 rounded-[8px] flex items-center gap-2.5 text-[12px] text-[#41454d] animate-pulse">
          <Loader2 className="w-4 h-4 text-[#e31837] animate-spin" />
          <span>Đang tính khoảng cách đường đi thực tế từ <strong>120 Yên Lãng</strong>...</span>
        </div>
      )}

      {/* Calculated Distance & Fee Card */}
      {distanceInfo && !isCalculating && (
        <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] space-y-2 text-[#15803d] animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[12px] font-bold border-b border-[#bbf7d0]/70 pb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              <span>Đã xác thực khoảng cách giao hàng</span>
            </div>
            <span className="text-[11px] font-normal text-gray-500">
              Xuất phát từ <strong>120 Yên Lãng</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
            <div className="p-2 rounded-[6px] bg-white/80 border border-[#bbf7d0]/60">
              <div className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
                <Navigation className="w-3 h-3 text-[#16a34a]" />
                Khoảng cách
              </div>
              <div className="text-[14px] font-bold text-[#181d26] mt-0.5">
                {distanceInfo.distanceText}
              </div>
            </div>

            <div className="p-2 rounded-[6px] bg-white/80 border border-[#bbf7d0]/60">
              <div className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Thời gian giao
              </div>
              <div className="text-[13px] font-bold text-[#181d26] mt-0.5">
                {distanceInfo.deliveryEstimateText}
              </div>
            </div>

            <div className="p-2 rounded-[6px] bg-white/80 border border-[#bbf7d0]/60">
              <div className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
                <Bike className="w-3 h-3 text-[#e31837]" />
                Phí ship gốc
              </div>
              <div className="text-[14px] font-bold text-[#e31837] mt-0.5">
                {formatVND(distanceInfo.shippingFee)}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center gap-1 pt-0.5">
            <Info className="w-3 h-3 text-gray-400 shrink-0" />
            <span>
              Cước phí tính theo tuyến đường xe máy Goong Maps (≤2km: 15.000₫, 2-10km: +5.000₫/km, &gt;10km: +7.000₫/km).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
