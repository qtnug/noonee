'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { CiLocationOn, CiCircleChevDown } from 'react-icons/ci';

interface BranchSelectorProps {
  compact?: boolean;
}

export default function BranchSelector({ compact = false }: BranchSelectorProps) {
  const { currentBranch, allBranches, selectBranch } = useBranch();
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
      {/* Trigger Button - Just address and icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2d5c8] bg-white/95 hover:bg-white hover:border-[#A30029] text-[#181d26] transition shadow-2xs group cursor-pointer ${
          compact ? 'text-[12px]' : 'text-[13px]'
        }`}
        title="Bấm để đổi cơ sở phục vụ"
      >
        <span className="w-5 h-5 rounded-full bg-red-50 text-[#A30029] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <CiLocationOn className="w-3.5 h-3.5 stroke-2 text-[#A30029]" />
        </span>
        <span className="font-bold text-[#A30029] truncate max-w-[130px] sm:max-w-[160px]">
          {currentBranch.shortName}
        </span>
        <CiCircleChevDown
          className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#A30029] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#A30029]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown - Only 2 branch buttons with address */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-[280px] sm:w-[320px] bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
          {allBranches.map((branch) => {
            const isSelected = branch.id === currentBranch.id;

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => {
                  selectBranch(branch.id);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-lg text-left transition cursor-pointer flex flex-col gap-0.5 ${
                  isSelected
                    ? 'border-2 border-[#A30029] bg-red-50/50 shadow-xs'
                    : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[13px] font-bold ${isSelected ? 'text-[#A30029]' : 'text-gray-900'}`}>
                  {branch.name}
                </span>
                <span className="text-[12px] text-gray-600 flex items-center gap-1">
                  <CiLocationOn className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{branch.address}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
