/**
 * Prototipo Académico - Universidad ORT Uruguay
 * Agente de Resolución de Reclamos Post-Entrega (Caso de Estudio: PedidosYa, Datos Sintéticos).
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CaseBuilder } from './components/CaseBuilder';
import { ExecutionPipeline } from './components/ExecutionPipeline';
import { StructuredJsonViewer } from './components/StructuredJsonViewer';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { RawJsonConsole } from './components/RawJsonConsole';
import { RulesReference } from './components/RulesReference';
import { BENCHMARK_CASES } from './data/benchmarkCases';
import { SyntheticClaimInput, AgentStructuredOutput } from './types/claim';
import { evaluateSyntheticClaim } from './lib/claimEngine';
import { Layers, FileJson, Sparkles, Scale, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workbench' | 'benchmark' | 'raw_json' | 'rules'>('workbench');
  const [currentInput, setCurrentInput] = useState<SyntheticClaimInput>(
    JSON.parse(JSON.stringify(BENCHMARK_CASES[0].input))
  );
  const [currentOutput, setCurrentOutput] = useState<AgentStructuredOutput | null>(null);
  const [workbenchView, setWorkbenchView] = useState<'pipeline' | 'json'>('pipeline');
  const [isLoading, setIsLoading] = useState(false);

  // Ejecuta evaluación inicial al cargar
  useEffect(() => {
    handleEvaluate();
  }, []);

  const handleEvaluate = async (inputToEvaluate?: SyntheticClaimInput) => {
    const input = inputToEvaluate || currentInput;
    setIsLoading(true);

    try {
      // Intentar primero endpoint del servidor Express (que puede incluir Gemini para visión multimodal)
      const res = await fetch('/api/evaluate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        const data: AgentStructuredOutput = await res.json();
        setCurrentOutput(data);
      } else {
        // Fallback al motor local puro
        const localResult = evaluateSyntheticClaim(input);
        setCurrentOutput(localResult);
      }
    } catch {
      // Fallback si la llamada de red falla
      const localResult = evaluateSyntheticClaim(input);
      setCurrentOutput(localResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBenchmarkCase = (testCaseInput: SyntheticClaimInput) => {
    setCurrentInput(testCaseInput);
    setActiveTab('workbench');
    handleEvaluate(testCaseInput);
  };

  const handleEvaluateDirect = async (inputJson: SyntheticClaimInput): Promise<AgentStructuredOutput | null> => {
    try {
      const res = await fetch('/api/evaluate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputJson),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return evaluateSyntheticClaim(inputJson);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Header institucional */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Workbench / Evaluador Interactivo */}
        {activeTab === 'workbench' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Case Builder Editor */}
            <div className="lg:col-span-6 space-y-4">
              <CaseBuilder
                currentInput={currentInput}
                onChangeInput={setCurrentInput}
                onEvaluate={() => handleEvaluate()}
                isLoading={isLoading}
              />
            </div>

            {/* Right Column: Execution Trace or Structured JSON */}
            <div className="lg:col-span-6 space-y-4">
              {/* Sub-view toggle (Pipeline vs JSON) */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setWorkbenchView('pipeline')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      workbenchView === 'pipeline'
                        ? 'bg-slate-800 text-rose-300 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Traza de Ejecución y Reglas</span>
                  </button>

                  <button
                    onClick={() => setWorkbenchView('json')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      workbenchView === 'json'
                        ? 'bg-slate-800 text-emerald-300 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>JSON Estructurado (OpenAPI)</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 px-2 font-mono">
                  {currentOutput?.decision ? `Decisión: ${currentOutput.decision}` : ''}
                </div>
              </div>

              {workbenchView === 'pipeline' ? (
                <ExecutionPipeline input={currentInput} output={currentOutput} />
              ) : (
                <StructuredJsonViewer output={currentOutput} isLoading={isLoading} />
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Benchmarks Suite (13 Casos) */}
        {activeTab === 'benchmark' && (
          <BenchmarkRunner onSelectCase={handleSelectBenchmarkCase} />
        )}

        {/* Tab 3: Raw JSON Console */}
        {activeTab === 'raw_json' && (
          <RawJsonConsole onEvaluateDirect={handleEvaluateDirect} />
        )}

        {/* Tab 4: Rules & Architecture Documentation */}
        {activeTab === 'rules' && <RulesReference />}
      </main>

      {/* Academic Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-400 space-y-1">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Universidad ORT Uruguay • Facultad de Ingeniería • Proyecto Académico
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Caso PedidosYa simulado • Datos puramente sintéticos • <code className="text-rose-400 font-mono">executed: false</code>
          </div>
        </div>
      </footer>
    </div>
  );
}
