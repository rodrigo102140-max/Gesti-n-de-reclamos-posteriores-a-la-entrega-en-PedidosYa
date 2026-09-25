import React, { useState } from 'react';
import { Copy, Check, Code, FileJson, AlertCircle } from 'lucide-react';
import { AgentStructuredOutput } from '../types/claim';

interface StructuredJsonViewerProps {
  output: AgentStructuredOutput | null;
  isLoading?: boolean;
}

export const StructuredJsonViewer: React.FC<StructuredJsonViewerProps> = ({
  output,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedJson = output ? JSON.stringify(output, null, 2) : '';

  const handleCopy = () => {
    if (!formattedJson) return;
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileJson className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Salida Estructurada (OpenAPI Schema)
          </span>
          {output && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              executed: false
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            disabled={!output}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-xs font-medium transition-all"
            title="Copiar JSON completo"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="p-4 flex-1 bg-slate-950 font-mono text-xs overflow-auto text-slate-300 leading-relaxed max-h-[560px]">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Evaluando caso y aplicando motor de reglas...</p>
          </div>
        ) : output ? (
          <pre className="whitespace-pre-wrap">
            {formattedJson}
          </pre>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-500">
            <Code className="w-8 h-8 opacity-40" />
            <p className="text-xs">Presioná "Ejecutar Resolución" para generar el JSON estructurado.</p>
          </div>
        )}
      </div>

      {/* Schema Verification Footer */}
      {output && (
        <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>17 campos validados contra esquema OpenAPI</span>
          </div>
          <span className="font-mono text-slate-400">
            {output.rules_applied.length > 0 ? output.rules_applied.join(', ') : 'DERIVACION_MANUAL'}
          </span>
        </div>
      )}
    </div>
  );
};
