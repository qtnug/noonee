'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import {
  CiLocationOn,
  CiCircleChevDown,
  CiCircleCheck,
  CiClock2,
  CiPhone,
  CiRedo,
  CiCompass1,
} from 'react-icons/ci';
import { calculateBranchDistanceKm } from '@/lib/branches';

interface BranchSelectorProps {
  compact?: boolean;
}

export default function BranchSelector({ compact = false }: BranchSelectorProps) {
  const { currentBranch, allBranches, userCoords, isAutoDetected, isLocating, selectBranch, detectAndSelectNearest } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e2d5c8] bg-white/90 hover:bg-white hover:border-[#A30029] text-[#1e293b] transition shadow-2xs group cursor-pointer ${
          compact ? 'text-[12px]' : 'text-[13px]'
        }`}
        title="Bấm để xem và đổi cơ sở phục vụ"
      >
        <span className="w-5 h-5 rounded-full bg-red-50 text-[#A30029] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <CiLocationOn className="w-3.5 h-3.5 stroke-2 text-[#A30029]" />
        </span>
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 font-normal">Cơ sở phục vụ:</span>
            {isAutoDetected && (
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded-sm">
                Gần nhất
              </span>
            )}
          </div>
          <span className="font-bold text-[#A30029] truncate max-w-[130px] sm:max-w-[160px]">
            {currentBranch.shortName}
          </span>
        </div>
        <CiCircleChevDown
          className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#A30029] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#A30029]' : ''
          }`}
        />
      </button>

      {/* Popover / Modal Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[320px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">Chọn cơ sở phục vụ</h3>
              <p className="text-[11px] text-gray-500">Thực đơn và phí ship tối ưu theo cơ sở</p>
            </div>
            <button
              type="button"
              onClick={() => detectAndSelectNearest()}
              disabled={isLocating}
              className="flex items-center gap-1 text-[11px] font-bold text-[#A30029] hover:bg-red-50 px-2 py-1 rounded-md transition cursor-pointer disabled:opacity-50"
              title="Định vị và tự động chọn quán gần nhất"
            >
              {isLocating ? (
                <CiRedo className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CiCompass1 className="w-3.5 h-3.5 stroke-2" />
              )}
              <span>{isLocating ? 'Đang định vị...' : 'Tự chọn gần nhất'}</span>
            </button>
          </div>

          {/* List of Branches */}
          <div className="mt-3 space-y-2.5">
            {allBranches.map((branch) => {
              const isSelected = branch.id === currentBranch.id;
              const distanceKm = userCoords
                ? calculateBranchDistanceKm(userCoords.lat, userCoords.lng, branch.lat, branch.lng)
                : null;

              return (
                <div
                  key={branch.id}
                  onClick={() => {
                    selectBranch(branch.id);
                    setIsOpen(false);
                  }}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-[#A30029] bg-red-50/40 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[13px] text-gray-900">
                          {branch.name}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-[#A30029] text-white px-1.5 py-0.5 rounded-full">
                            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đang chọn
                          </span>
                        )}
                        {distanceKm !== null && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                            Cách bạn ~{distanceKm} km
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-600 flex items-start gap-1">
                        <CiLocationOn className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-0.5">
                        <span className="flex items-center gap-0.5">
                          <CiClock2 className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Mở cửa: {branch.openHours}</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <CiPhone className="w-3 h-3 text-gray-400" />
                          <span>{branch.phone}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Explanatory Note */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 flex items-center gap-1.5">
            <span className="text-amber-500 font-bold shrink-0">✦</span>
            <span>Hệ thống tự động duyệt món theo cơ sở gần nhất. Đổi cơ sở chỉ là tùy chọn của bạn!</span>
          </div>
        </div>
      )}
    </div>
  );
}

