import React from 'react';
import { BookOpen, ShieldAlert, CheckCircle, Scale, Eye, AlertCircle } from 'lucide-react';

export const RulesReference: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-rose-400">
          <Scale className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">
            Especificación Formal de Reglas Simuladas (ORT Uruguay)
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Este sistema es un <strong>prototipo académico</strong> desarrollado en el marco de la Universidad ORT Uruguay. El caso de estudio es PedidosYa, pero las políticas y reglas fueron construidas como supuestos metodológicos por el equipo y <strong>NO corresponden a las operativas internas reales de la empresa</strong>.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs font-mono">
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Moneda</span>
            <span className="font-bold text-slate-200">UYU</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Tope Auto</span>
            <span className="font-bold text-rose-400">$600 UYU</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Banda Low</span>
            <span className="font-bold text-emerald-400">≤ $400</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Banda Medium</span>
            <span className="font-bold text-amber-400">$401 - $600</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Ventana</span>
            <span className="font-bold text-slate-200">48 Horas</span>
          </div>
        </div>
      </div>

      {/* Principio Percepción vs Decisión */}
      <div className="bg-slate-900 border border-amber-600/30 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-amber-400">
          <Eye className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white">
            Regla Central de Arquitectura: Separación de Percepción y Decisión
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Una imagen <strong>nunca decide sola</strong>: informa la decisión, no la reemplaza. Al describir lo visual en <code className="text-amber-300 font-mono">evidence_observations</code>, está <strong>estrictamente prohibido</strong> mencionar montos, dinero, compensaciones, fraude o culpa del repartidor/local.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-600/40 text-emerald-200">
            <span className="font-bold block mb-1">✓ Percepción Válida:</span>
            "Se observa un pote de helado con tapa desprendida y contenido líquido esparcido en el interior de la bolsa plástica."
          </div>
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-600/40 text-rose-200">
            <span className="font-bold block mb-1">✗ Percepción Prohibida (Invasión de decisión):</span>
            "Corresponde devolverle el importe al cliente porque el delivery tuvo la culpa de romper el pote."
          </div>
        </div>
      </div>

      {/* Fase A: Guardas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white">
            Fase A — Guardas de Seguridad (Evaluación Prioritaria)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Si cualquier guarda se cumple, el caso va <strong>directo a una persona</strong> (human_review). La Fase B de resolución no se evalúa.
        </p>

        <div className="space-y-2 text-xs">
          {[
            {
              id: 'SIM_GUARD_001',
              title: 'Evidencia visual contradice al cliente',
              condition: 'evidence_status = contradicts_claim',
              reason: 'evidence_contradicts_description',
              note: 'La foto muestra el producto intacto mientras el cliente describe rotura.',
            },
            {
              id: 'SIM_GUARD_002',
              title: 'Tipo de reclamo no cubierto por el prototipo',
              condition: 'claim_type in [other, unclear, delayed_order]',
              reason: 'claim_type_not_covered',
              note: 'delayed_order está aquí deliberadamente: el equipo no relevó la política de demoras de PedidosYa.',
            },
            {
              id: 'SIM_GUARD_003',
              title: 'Cliente cuestiona resolución anterior',
              condition: 'customer_disputes_previous_resolution = True',
              reason: 'customer_disputes_previous_resolution',
              note: 'Disconformidad con un cupón o resolución previa del mismo pedido.',
            },
            {
              id: 'SIM_GUARD_004',
              title: 'Fuera de ventana de reclamo',
              condition: 'hours_since_delivery > 48',
              reason: 'outside_claim_window',
              note: 'El reclamo se abrió superando las 48 horas simuladas.',
            },
            {
              id: 'SIM_GUARD_005',
              title: 'Importe superior al tope automático',
              condition: 'affected_amount > 600 UYU (banda high)',
              reason: 'amount_above_auto_limit',
              note: 'Ningún caso por encima de $600 UYU se resuelve sin autorización humana.',
            },
            {
              id: 'SIM_GUARD_006',
              title: 'Baja confianza de clasificación',
              condition: 'confidence < 0.60',
              reason: 'low_classifier_confidence',
              note: 'Inconsistencia grave entre el menú seleccionado y el relato escrito del cliente.',
            },
          ].map((guard) => (
            <div
              key={guard.id}
              className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-rose-400">{guard.id}</span>
                  <span className="font-semibold text-slate-200">{guard.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{guard.note}</p>
              </div>
              <div className="text-right shrink-0">
                <code className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono block">
                  {guard.condition}
                </code>
                <span className="text-[10px] text-amber-400 font-mono">
                  → {guard.reason}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fase B: Reglas de Resolución */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white">
            Fase B — Reglas de Resolución Simuladas
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Se evalúan únicamente cuando ninguna guarda fue disparada.
        </p>

        <div className="space-y-2 text-xs">
          {[
            {
              id: 'SIM_RULE_001',
              title: 'Faltante en banda baja (≤ 400 UYU)',
              conditions: 'missing_item + banda low',
              decision: 'proposed_refund',
              requires_photo: 'No',
            },
            {
              id: 'SIM_RULE_002',
              title: 'Producto dañado con evidencia consistente',
              conditions: 'damaged_product + supports_claim',
              decision: 'proposed_refund',
              requires_photo: 'Sí (apoya reclamo)',
            },
            {
              id: 'SIM_RULE_003',
              title: 'Producto equivocado con evidencia consistente',
              conditions: 'wrong_item + supports_claim',
              decision: 'proposed_refund',
              requires_photo: 'Sí (apoya reclamo)',
            },
            {
              id: 'SIM_RULE_004',
              title: 'Reclamo que necesita evidencia y falta o es borrosa',
              conditions: '[damaged_product, wrong_item] + [not_provided, insufficient, unclear]',
              decision: 'request_more_information',
              requires_photo: 'Solicita foto legible',
            },
            {
              id: 'SIM_RULE_005',
              title: 'Faltante en banda media (401 - 600 UYU)',
              conditions: 'missing_item + banda medium',
              decision: 'proposed_coupon',
              requires_photo: 'No',
            },
            {
              id: 'SIM_RULE_006',
              title: 'Demora en acreditación de reembolso previo',
              conditions: 'refund_delay + tiene reembolso aprobado/pendiente',
              decision: 'no_compensation',
              requires_photo: 'No (mensaje informativo)',
            },
          ].map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-emerald-400">{rule.id}</span>
                  <span className="font-semibold text-slate-200">{rule.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Condición: <code className="text-slate-300 font-mono">{rule.conditions}</code>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                  {rule.decision}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Foto: {rule.requires_photo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
