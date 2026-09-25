import React from 'react';
import {
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  UserCheck,
  Layers,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { AgentStructuredOutput, SyntheticClaimInput } from '../types/claim';

interface ExecutionPipelineProps {
  input: SyntheticClaimInput;
  output: AgentStructuredOutput | null;
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({ input, output }) => {
  if (!output) {
    return null;
  }

  const isHumanReview = output.requires_human_review;
  const isGuardTriggered = output.rules_applied.some((r) => r.startsWith('SIM_GUARD'));
  const appliedRuleOrGuard = output.rules_applied[0] || (output.human_review_reason[0] || 'REVISION_MANUAL');

  return (
    <div className="space-y-4">
      {/* Resumen Principal de la Decisión */}
      <div
        className={`p-4 rounded-xl border ${
          isHumanReview
            ? 'bg-amber-950/20 border-amber-600/40 text-amber-200'
            : output.decision === 'proposed_refund' || output.decision === 'proposed_coupon'
            ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-200'
            : output.decision === 'request_more_information'
            ? 'bg-blue-950/20 border-blue-600/40 text-blue-200'
            : 'bg-slate-900 border-slate-700 text-slate-200'
        } shadow-lg transition-all`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/60 font-semibold">
                {output.decision.toUpperCase().replace('_', ' ')}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {appliedRuleOrGuard}
              </span>
              {output.proposed_amount !== null && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ${output.proposed_amount} {output.currency}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-100 mt-1">
              {output.proposed_resolution}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                isHumanReview
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isHumanReview ? 'Derivado a Humano' : 'Propuesta Simulada'}
            </span>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              executed: false
            </div>
          </div>
        </div>

        {/* Mensaje al cliente con estilo de chat */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold text-slate-300">Mensaje redactado al cliente (Español Rioplatense):</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
            "{output.customer_message}"
          </div>
        </div>
      </div>

      {/* Traza de Auditoría / Steps Pipeline */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Traza de Evaluación por Fases (Metodología ORT)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Caso: <strong className="text-slate-200">{output.case_id}</strong> • Pedido: <strong className="text-slate-200">{output.order_id}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Paso 1: Percepción vs Decisión */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Percepción Visual Pura</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {output.evidence_status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Regla de oro: estrictamente descriptiva sin montos, culpas ni juicios resolutivos.
            </p>
            {output.evidence_observations.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {output.evidence_observations.map((obs, idx) => (
                  <li key={idx} className="leading-snug">{obs}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500">Sin observaciones (no se adjuntó o no requería foto).</p>
            )}
          </div>

          {/* Paso 2: Clasificación y Consistencia */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Clasificación & Consistencia</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-medium">
                {output.claim_type}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Motivo menú: <strong className="text-slate-300">{input.menu_reason}</strong>
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400">Ventana temporal:</span>
              <span className={`font-mono ${input.hours_since_delivery <= 48 ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
                {input.hours_since_delivery}h / 48h ({input.hours_since_delivery <= 48 ? 'Dentro' : 'Excedido'})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Disputa resolución anterior:</span>
              <span className={`font-mono ${input.customer_disputes_previous_resolution ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {input.customer_disputes_previous_resolution ? 'SÍ (Disputa activa)' : 'No'}
              </span>
            </div>
          </div>

          {/* Paso 3: Identificación de Producto e Importes */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Matching de Producto e Importe</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Banda: {output.affected_items.length > 0 ? (output.affected_items.reduce((s, i) => s + i.amount, 0) <= 400 ? 'low' : output.affected_items.reduce((s, i) => s + i.amount, 0) <= 600 ? 'medium' : 'high') : 'N/A'}
              </span>
            </div>
            {output.affected_items.length > 0 ? (
              <div className="space-y-1 text-[11px]">
                {output.affected_items.map((it) => (
                  <div key={it.product_id} className="flex justify-between text-slate-300">
                    <span>{it.name} ({it.qty}x ${it.unit_price})</span>
                    <span className="font-mono font-bold">${it.amount} UYU</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-slate-800 flex justify-between text-slate-200 font-bold">
                  <span>Total afectado:</span>
                  <span className="font-mono text-emerald-400">
                    ${output.affected_items.reduce((s, i) => s + i.amount, 0)} UYU (Tope auto: $600)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-rose-400 font-medium">
                No se encontró el producto en las líneas del pedido o es reclamo no asociable a ítem.
              </p>
            )}
          </div>

          {/* Paso 4: Fase A - Guardas de Seguridad */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>4. Fase A: Guardas de Seguridad</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                  isGuardTriggered
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isGuardTriggered ? 'Guarda Disparada' : 'Guardas Superadas'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluación prioritaria: SIM_GUARD_001 a SIM_GUARD_006.
            </p>
            {isGuardTriggered ? (
              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-200">
                <strong>{output.rules_applied[0]}:</strong> Se activó la guarda de seguridad. El caso no avanza a reglas de resolución y pasa a revisión humana.
              </div>
            ) : (
              <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Ninguna guarda se cumplió. Procede a Fase B (Reglas simuladas).</span>
              </p>
            )}
          </div>
        </div>

        {/* Paso 5: Fase B - Reglas de Resolución */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>5. Fase B: Aplicación de Regla de Resolución Simulada</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {output.rules_applied.length > 0 ? output.rules_applied.join(', ') : 'Ninguna'}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed">
            {output.rules_applied.some((r) => r.startsWith('SIM_RULE')) ? (
              <div className="flex items-start space-x-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{output.rules_applied[0]}:</strong> Se aplicó exitosamente la regla simulada correspondiente para emitir una propuesta estructurada.
                </span>
              </div>
            ) : isGuardTriggered ? (
              <span className="text-slate-400">
                Omitida: La Fase B no se ejecutó debido a la intercepción previa de una Guarda en la Fase A.
              </span>
            ) : (
              <span className="text-amber-400">
                Derivación a humano: {output.human_review_reason.join(', ') || 'no_matching_rule'}
              </span>
            )}
          </div>

          {/* Nota de Confianza del Agente */}
          {output.confidence_note && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Nota de confianza metodológica:</strong> {output.confidence_note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
