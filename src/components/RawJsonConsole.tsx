import React, { useState } from 'react';
import { Play, Copy, Check, AlertCircle, FileCode, RotateCcw } from 'lucide-react';
import { SyntheticClaimInput, AgentStructuredOutput } from '../types/claim';
import { BENCHMARK_CASES } from '../data/benchmarkCases';

interface RawJsonConsoleProps {
  onEvaluateDirect: (inputJson: SyntheticClaimInput) => Promise<AgentStructuredOutput | null>;
}

export const RawJsonConsole: React.FC<RawJsonConsoleProps> = ({ onEvaluateDirect }) => {
  const [inputRaw, setInputRaw] = useState<string>(
    JSON.stringify(BENCHMARK_CASES[0].input, null, 2)
  );
  const [outputRaw, setOutputRaw] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(inputRaw);
      setIsProcessing(true);
      const res = await onEvaluateDirect(parsed);
      if (res) {
        setOutputRaw(JSON.stringify(res, null, 2));
      }
    } catch (err: any) {
      setParseError(err.message || 'JSON de entrada no válido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = (caseId: string) => {
    const found = BENCHMARK_CASES.find((b) => b.id === caseId);
    if (found) {
      setInputRaw(JSON.stringify(found.input, null, 2));
      setParseError(null);
    }
  };

  const handleCopyOutput = () => {
    if (!outputRaw) return;
    navigator.clipboard.writeText(outputRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-rose-400" />
            <span>Consola de Evaluación Directa por JSON</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ingresá cualquier carga sintética en formato JSON y obtené la salida estructurada oficial del agente.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            onChange={(e) => handleLoadSample(e.target.value)}
            defaultValue=""
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none"
          >
            <option value="" disabled>
              Cargar preset de prueba...
            </option>
            {BENCHMARK_CASES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id}: {b.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {isProcessing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>Evaluar Caso</span>
          </button>
        </div>
      </div>

      {parseError && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Error de formato en el JSON de entrada: {parseError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor de Entrada */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[520px]">
          <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Entrada Sintética (JSON)
            </span>
            <button
              onClick={() => handleLoadSample('BENCH-01')}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar demo</span>
            </button>
          </div>
          <textarea
            value={inputRaw}
            onChange={(e) => setInputRaw(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Visor de Salida */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[520px]">
          <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Salida del Agente (OpenAPI Schema)
            </span>
            <button
              onClick={handleCopyOutput}
              disabled={!outputRaw}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <div className="w-full flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-auto leading-relaxed">
            {outputRaw ? (
              <pre className="whitespace-pre-wrap">{outputRaw}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <FileCode className="w-8 h-8 opacity-40" />
                <p className="text-xs">Presioná "Evaluar Caso" para generar la salida JSON.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
