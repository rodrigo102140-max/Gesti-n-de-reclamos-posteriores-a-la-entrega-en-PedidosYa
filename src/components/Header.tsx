import React from 'react';
import { ShieldAlert, BookOpen, Sparkles, Scale, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'workbench' | 'demo_registry' | 'benchmark' | 'raw_json' | 'rules';
  setActiveTab: (tab: 'workbench' | 'demo_registry' | 'benchmark' | 'raw_json' | 'rules') => void;
  demoCasesCount?: number;
  onResetCase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  demoCasesCount = 8,
  onResetCase,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Agente de Reclamos Post-Entrega
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                  ORT Uruguay
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Caso PedidosYa (Sintético)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prototipo Académico de Resolución Asistida • Propuesta Simulada (<code className="text-rose-400">executed: false</code>)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'workbench'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Evaluador Interactivo
            </button>
            <button
              onClick={() => setActiveTab('demo_registry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'demo_registry'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>Registro de Casos</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-850 border border-slate-700 font-mono text-rose-300">
                {demoCasesCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'benchmark'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Benchmarks (13 Casos)</span>
            </button>
            <button
              onClick={() => setActiveTab('raw_json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'raw_json'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Consola JSON
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'rules'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reglas & Guardas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Academic Disclaimer Banner */}
      <div className="bg-rose-950/40 border-t border-b border-rose-900/40 px-4 py-1.5 text-xs text-rose-200/90 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>ADVERTENCIA METODOLÓGICA:</strong> Este sistema es un prototipo académico con datos y reglas simuladas. No representa la operativa real ni políticas corporativas de PedidosYa. Ningún cobro o acreditación es ejecutado.
          </span>
        </div>
      </div>
    </header>
  );
};
