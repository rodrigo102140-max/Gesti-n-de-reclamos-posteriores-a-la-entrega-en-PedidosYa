import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCheck,
  Shield,
  BookOpen,
} from 'lucide-react';
import { BENCHMARK_CASES } from '../data/benchmarkCases';
import { BenchmarkCase, SyntheticClaimInput, AgentStructuredOutput } from '../types/claim';
import { evaluateSyntheticClaim } from '../lib/claimEngine';

interface BenchmarkRunnerProps {
  onSelectCase: (testCase: SyntheticClaimInput) => void;
}

export const BenchmarkRunner: React.FC<BenchmarkRunnerProps> = ({ onSelectCase }) => {
  const [filter, setFilter] = useState<'ALL' | 'Reglas' | 'Guardas' | 'Casos Borde'>('ALL');
  const [results, setResults] = useState<{ [id: string]: AgentStructuredOutput }>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  const filteredCases = BENCHMARK_CASES.filter(
    (c) => filter === 'ALL' || c.category === filter
  );

  const runAllBenchmarks = () => {
    setIsRunningAll(true);
    const newResults: { [id: string]: AgentStructuredOutput } = {};

    BENCHMARK_CASES.forEach((bCase) => {
      newResults[bCase.id] = evaluateSyntheticClaim(bCase.input);
    });

    setResults(newResults);
    setIsRunningAll(false);
  };

  const getPassStatus = (bCase: BenchmarkCase) => {
    const res = results[bCase.id];
    if (!res) return null;

    const matchesDecision = res.decision === bCase.expected_decision;
    const matchesRuleOrGuard = bCase.expected_rule_or_guard.startsWith('SIM_')
      ? res.rules_applied.includes(bCase.expected_rule_or_guard)
      : bCase.expected_review_reason
      ? res.human_review_reason.includes(bCase.expected_review_reason)
      : true;

    return matchesDecision && matchesRuleOrGuard;
  };

  const totalRun = Object.keys(results).length;
  const totalPassed = BENCHMARK_CASES.filter((b) => getPassStatus(b) === true).length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Run Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Suite de Validación Académica (13 Casos de Estudio)
              </h2>
              <p className="text-xs text-slate-400">
                Verificación sistemática de todas las Guardas (SIM_GUARD_001..006) y Reglas (SIM_RULE_001..006).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {totalRun > 0 && (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center space-x-2">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Pasan: <strong className="text-emerald-400">{totalPassed}</strong> / {BENCHMARK_CASES.length} ({( (totalPassed / BENCHMARK_CASES.length) * 100).toFixed(0)}%)
              </span>
            </div>
          )}

          <button
            onClick={runAllBenchmarks}
            disabled={isRunningAll}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{totalRun === 0 ? 'Ejecutar los 13 Casos' : 'Re-ejecutar Todos'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-400">Filtrar por categoría:</span>
        {(['ALL', 'Reglas', 'Guardas', 'Casos Borde'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === cat
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat === 'ALL' ? 'Todos (13)' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((bCase) => {
          const passStatus = getPassStatus(bCase);
          const actualResult = results[bCase.id];

          return (
            <div
              key={bCase.id}
              className={`rounded-xl border p-4 bg-slate-900 transition-all flex flex-col justify-between ${
                passStatus === true
                  ? 'border-emerald-600/40 shadow-emerald-950/20'
                  : passStatus === false
                  ? 'border-rose-600/40 shadow-rose-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {bCase.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        bCase.category === 'Guardas'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : bCase.category === 'Reglas'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {bCase.category}
                    </span>
                  </div>

                  {passStatus !== null && (
                    <span
                      className={`flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                        passStatus
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {passStatus ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>PASA</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>FALLA</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-100">{bCase.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {bCase.description}
                </p>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Esperado:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {bCase.expected_rule_or_guard} ({bCase.expected_decision})
                    </span>
                  </div>
                  {actualResult && (
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-900">
                      <span>Obtenido:</span>
                      <span className="font-mono text-emerald-300 font-semibold">
                        {actualResult.rules_applied[0] || actualResult.human_review_reason[0]} ({actualResult.decision})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {bCase.input.order_id}
                </span>

                <button
                  onClick={() => onSelectCase(bCase.input)}
                  className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium transition-all"
                >
                  <span>Cargar en Evaluador</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
