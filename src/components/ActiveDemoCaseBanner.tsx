import React from 'react';
import {
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Store,
  DollarSign,
  FileText,
  Camera,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { DemoCaseRecord } from '../types/demoCase.ts';

interface ActiveDemoCaseBannerProps {
  demoCase: DemoCaseRecord | null;
  onOpenRegistryTab: () => void;
  onReevaluate: () => void;
}

export const ActiveDemoCaseBanner: React.FC<ActiveDemoCaseBannerProps> = ({
  demoCase,
  onOpenRegistryTab,
  onReevaluate,
}) => {
  if (!demoCase) return null;

  const isHumanReview = demoCase.human_intervention.required;
  const isResolved = demoCase.claim_status === 'resuelto';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-rose-500/30 rounded-xl p-4 shadow-xl text-slate-200 space-y-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Header: Case ID, Number, Name and Data Source */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-sm shrink-0">
            {demoCase.case_number}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-semibold border border-slate-700">
                {demoCase.id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Orden: <strong className="text-slate-100">{demoCase.order_data.order_id}</strong>
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                  isHumanReview
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isHumanReview ? 'Intervención Humana Requerida' : 'Resolución Automática Prevista'}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white mt-1">{demoCase.name}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <span className="text-[11px] text-slate-400 italic hidden md:inline">
            Origen: {demoCase.data_source}
          </span>
          <button
            onClick={onOpenRegistryTab}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Ficha del Caso</span>
          </button>
        </div>
      </div>

      {/* Description Summary */}
      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
        {demoCase.description}
      </p>

      {/* Flow Progress Step Indicator (Paso actual) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Flujo del reclamo y paso actual:</span>
          <span className="text-rose-400 font-bold">
            Paso {demoCase.current_step.step_number} de 4: {demoCase.current_step.step_name}
          </span>
        </div>

        {/* 4 Steps Visual Bar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, title: 'Recepción' },
            { num: 2, title: 'Guardas' },
            { num: 3, title: 'Reglas' },
            { num: 4, title: 'Resolución' },
          ].map((st) => {
            const isCurrent = st.num === demoCase.current_step.step_number;
            const isPast = st.num < demoCase.current_step.step_number;
            return (
              <div
                key={st.num}
                className={`py-1.5 px-2 rounded text-center text-[11px] font-semibold border transition-all ${
                  isCurrent
                    ? 'bg-rose-600/30 border-rose-500 text-rose-200 shadow-sm'
                    : isPast
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className="mr-1">{st.num}.</span>
                <span>{st.title}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 italic">
          Detalle del paso: {demoCase.current_step.details}
        </div>
      </div>

      {/* 6 Structured Cards Matrix covering all required attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Card 1: Cliente & Pedido */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Cliente y Pedido</span>
          </div>
          <div>
            <div className="font-medium text-slate-200">{demoCase.customer.name}</div>
            <div className="text-[11px] text-slate-400">{demoCase.customer.phone || 'Tel: S/D'}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {demoCase.customer.delivery_address || 'Entrega estándar'}
            </div>
          </div>
          <div className="pt-1 border-t border-slate-900 flex justify-between text-[11px]">
            <span className="text-slate-400">Total orden:</span>
            <span className="font-mono font-bold text-slate-200">
              ${demoCase.total_order_amount} {demoCase.order_data.currency}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Entregado hace:</span>
            <span className="font-mono text-slate-300">
              {demoCase.order_data.delivered_at_hours_ago} hora(s)
            </span>
          </div>
        </div>

        {/* Card 2: Comercio & Producto Afectado */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Comercio y Producto Afectado</span>
          </div>
          <div>
            <div className="font-medium text-slate-200">{demoCase.merchant.name}</div>
            <div className="text-[11px] text-slate-400">{demoCase.merchant.category} • {demoCase.merchant.zone}</div>
          </div>
          <div className="pt-1 border-t border-slate-900">
            <div className="text-[11px] text-slate-400">Producto reclamado:</div>
            <div className="font-medium text-rose-300 truncate">
              {demoCase.claimed_product.name} (x{demoCase.claimed_product.qty})
            </div>
            <div className="flex justify-between text-[11px] mt-0.5">
              <span className="text-slate-400">Importe afectado:</span>
              <span className="font-mono font-bold text-rose-400">
                ${demoCase.total_affected_amount} {demoCase.order_data.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Evidencia & Suficiencia */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span>Evidencia y Suficiencia</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Tipo de evidencia:</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
              {demoCase.evidence.evidence_type}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">¿Es suficiente?:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                demoCase.evidence.is_sufficient
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {demoCase.evidence.is_sufficient ? 'Sí, suficiente' : 'No suficiente / Contradice'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-900/60 p-1.5 rounded">
            {demoCase.evidence.photo_description || 'Sin imagen adjunta'}
          </div>
        </div>

        {/* Card 4: Análisis y Fundamento */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resultado de Análisis y Fundamento</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Tipo detectado:</span>
            <span className="font-mono text-slate-200">{demoCase.analysis_result.detected_claim_type}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Banda de importe:</span>
            <span className="font-mono uppercase text-slate-200">{demoCase.analysis_result.amount_band}</span>
          </div>
          <div className="pt-1 border-t border-slate-900 text-[11px] text-slate-300 leading-snug">
            <strong>Fundamento:</strong> {demoCase.expected_resolution.rationale}
          </div>
        </div>

        {/* Card 5: Intervención Humana */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Intervención Humana</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Requerida:</span>
            <span
              className={`font-semibold text-[11px] ${
                demoCase.human_intervention.required ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {demoCase.human_intervention.required ? 'Sí (Derivación)' : 'No (Automático)'}
            </span>
          </div>
          {demoCase.human_intervention.reasons.length > 0 && (
            <div className="text-[11px] text-amber-300/90 font-mono bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
              Motivo: {demoCase.human_intervention.reasons.join(', ')}
            </div>
          )}
          <div className="text-[11px] text-slate-400">
            {demoCase.human_intervention.analyst_note}
          </div>
        </div>

        {/* Card 6: Devolución & Mensaje al Cliente */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
            <CreditCard className="w-3.5 h-3.5 text-rose-400" />
            <span>Devolución y Mensaje al Cliente</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Elección del cliente:</span>
            <span className="font-semibold text-slate-200">
              {demoCase.refund_options.choice_description}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Estado de devolución:</span>
            <span className="font-mono text-rose-400 uppercase text-[10px] px-1 bg-slate-900 rounded">
              {demoCase.refund_status}
            </span>
          </div>
          <div className="pt-1 border-t border-slate-900 text-[10px] text-slate-300 font-mono line-clamp-2 bg-slate-900/80 p-1.5 rounded">
            {demoCase.customer_message}
          </div>
        </div>
      </div>
    </div>
  );
};
