import React from 'react';
import { Download, ArrowUpRight } from 'lucide-react';

export type AdminSubTab = 'slides' | 'settings' | 'deploy';

interface PublicTopBarProps {
  brandName: string;
  deckTitle: string;
  onExportPptx: () => void;
  isExporting: boolean;
  isLocked: boolean;
}

export const PublicTopBar: React.FC<PublicTopBarProps> = ({
  brandName,
  deckTitle,
  onExportPptx,
  isExporting,
  isLocked,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
        <span className="font-display-headwood text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          {brandName || 'Wadah Slide'}
        </span>

        <p className="hidden md:block text-sm font-medium text-slate-600 truncate">
          {deckTitle}
        </p>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportPptx}
            disabled={isExporting || isLocked}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isExporting ? 'Memproses...' : 'Unduh PPTX'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

interface AdminTopBarProps {
  activeSubTab: AdminSubTab;
  onSubTabChange: (tab: AdminSubTab) => void;
  onGoPublic: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  activeSubTab,
  onSubTabChange,
  onGoPublic,
}) => {
  const navItems: { id: AdminSubTab; label: string }[] = [
    { id: 'slides', label: 'Kelola Slide' },
    { id: 'settings', label: 'Pengaturan & GAS' },
    { id: 'deploy', label: 'Kode & Deploy' },
  ];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
        <span className="font-display-headwood text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Wadah Admin
        </span>

        <nav aria-label="Navigasi Admin" className="flex items-center gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSubTabChange(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md ${
                  isActive
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-slate-950 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onGoPublic}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lihat Publik</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
