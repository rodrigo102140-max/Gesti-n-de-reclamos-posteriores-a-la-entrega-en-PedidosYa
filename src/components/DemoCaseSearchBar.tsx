import React, { useState } from 'react';
import { Search, Sparkles, Bookmark, ArrowRight, X } from 'lucide-react';
import type { DemoCaseRecord } from '../types/demoCase.ts';
import { findDemoCase } from '../lib/demoCasesStore.ts';

interface DemoCaseSearchBarProps {
  demoCases: DemoCaseRecord[];
  activeCaseId: string | null;
  onSelectCase: (record: DemoCaseRecord) => void;
  onOpenHub?: () => void;
}

export const DemoCaseSearchBar: React.FC<DemoCaseSearchBarProps> = ({
  demoCases,
  activeCaseId,
  onSelectCase,
  onOpenHub,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    const match = findDemoCase(searchTerm, demoCases);
    if (match) {
      setErrorMessage(null);
      onSelectCase(match);
    } else {
      setErrorMessage(`No se encontró ningún caso con "${searchTerm}". Probá con "Caso A", "B", "2", "Helado", "Flan" o "SYN-CASE-003".`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg space-y-2.5">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Llamar caso por nombre, número o ID (ej: 'Caso A', 'B', '2', '8', 'Helado', 'Flan', 'SYN-CASE-003')..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-sans"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setErrorMessage(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Llamar Caso</span>
        </button>

        {onOpenHub && (
          <button
            type="button"
            onClick={onOpenHub}
            className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-medium transition-colors shrink-0"
            title="Ver catálogo completo de casos persistidos"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Ver Catálogo</span>
          </button>
        )}
      </form>

      {/* Error feedback if no match */}
      {errorMessage && (
        <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white ml-2 text-xs">
            Descartar
          </button>
        </div>
      )}

      {/* Fast Quick-Call Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center">
          Acceso Rápido:
        </span>

        {demoCases.slice(0, 7).map((c) => {
          const isActive = activeCaseId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSearchTerm(c.name);
                setErrorMessage(null);
                onSelectCase(c);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border flex items-center space-x-1 ${
                isActive
                  ? 'bg-rose-600/30 text-rose-200 border-rose-500 shadow-sm'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-rose-400">
                {c.case_number}
              </span>
              <span>{c.name.split(':')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
