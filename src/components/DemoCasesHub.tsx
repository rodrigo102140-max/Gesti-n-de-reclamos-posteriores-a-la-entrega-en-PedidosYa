import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Play,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  User,
  Store,
  DollarSign,
  Camera,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
} from 'lucide-react';
import type { DemoCaseRecord } from '../types/demoCase.ts';
import {
  saveDemoCases,
  resetDemoCasesToDefault,
  upsertDemoCase,
  deleteDemoCase,
} from '../lib/demoCasesStore.ts';

interface DemoCasesHubProps {
  demoCases: DemoCaseRecord[];
  onUpdateDemoCases: (cases: DemoCaseRecord[]) => void;
  onSelectAndRunCase: (demoCase: DemoCaseRecord) => void;
}

export const DemoCasesHub: React.FC<DemoCasesHubProps> = ({
  demoCases,
  onUpdateDemoCases,
  onSelectAndRunCase,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'auto' | 'human_review' | 'request_info'>('all');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(demoCases[0]?.id || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filtered cases
  const filteredCases = demoCases.filter((c) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !searchFilter ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.case_number.toLowerCase().includes(q) ||
      c.claimed_product.name.toLowerCase().includes(q) ||
      c.merchant.name.toLowerCase().includes(q) ||
      c.customer.name.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'auto') {
      return !c.human_intervention.required && c.expected_resolution.decision !== 'request_more_information';
    }
    if (statusFilter === 'human_review') {
      return c.human_intervention.required;
    }
    if (statusFilter === 'request_info') {
      return c.expected_resolution.decision === 'request_more_information';
    }
    return true;
  });

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restablecer todos los casos de demostración a los predeterminados de fábrica?')) {
      const reset = resetDemoCasesToDefault();
      onUpdateDemoCases(reset);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(demoCases, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `registro_casos_demostracion_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          saveDemoCases(parsed);
          onUpdateDemoCases(parsed);
          alert(`Se importaron ${parsed.length} casos exitosamente.`);
        } else {
          alert('El archivo no contiene un array de casos válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este caso del registro?')) {
      const updated = deleteDemoCase(id);
      onUpdateDemoCases(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Registro Persistente de Casos de Demostración
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-rose-300 font-mono font-semibold border border-slate-700">
              {demoCases.length} casos registrados
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Catálogo persistente que almacena los casos de especificación académica (Caso A, Caso B, Caso C/8, Caso 2) y casos de prueba. Cada registro preserva sus 13 dimensiones: cliente, pedido, comercio, evidencia, análisis, resolución prevista, intervención humana, estado de devolución y mensaje al cliente.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="Descargar archivo JSON de casos"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-medium transition-colors"
            title="Restablecer casos de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar por nombre, número (ej: 'A', 'B', '2'), producto, comercio o identificador..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center space-x-1">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'auto', label: 'Resolución Auto' },
              { id: 'human_review', label: 'Revisión Humana' },
              { id: 'request_info', label: 'Pide Info' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
            <p className="text-sm">No se encontraron casos de demostración para el filtro actual.</p>
            <button
              onClick={() => {
                setSearchFilter('');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          filteredCases.map((demoCase) => {
            const isExpanded = expandedCaseId === demoCase.id;
            const isHumanReview = demoCase.human_intervention.required;

            return (
              <div
                key={demoCase.id}
                className="bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all overflow-hidden shadow-md"
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => setExpandedCaseId(isExpanded ? null : demoCase.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-slate-900/90 hover:bg-slate-850 transition-colors"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm shrink-0">
                      {demoCase.case_number}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-rose-300 font-bold border border-slate-800">
                          {demoCase.id}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                          {demoCase.order_data.order_id}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                            isHumanReview
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isHumanReview ? 'Revisión Humana' : 'Resolución Automática'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Importe: ${demoCase.total_affected_amount} {demoCase.order_data.currency}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">{demoCase.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAndRunCase(demoCase);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
                      title="Cargar en el flujo de reclamo y ejecutar"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Cargar y Ejecutar</span>
                    </button>

                    {demoCase.is_custom && (
                      <button
                        onClick={(e) => handleDeleteCase(demoCase.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Eliminar caso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed 13-Attribute View */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-4 text-xs">
                    {/* Description and Data Source */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="md:col-span-2">
                        <span className="text-slate-400 font-semibold block mb-0.5">Descripción del Caso:</span>
                        <p className="text-slate-300 leading-relaxed">{demoCase.description}</p>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                        <span className="text-slate-400 font-semibold block mb-0.5">Origen de los Datos:</span>
                        <p className="text-rose-300 font-mono text-[11px]">{demoCase.data_source}</p>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Paso Actual: <strong className="text-slate-200">{demoCase.current_step.step_name}</strong> ({demoCase.current_step.status})
                        </div>
                      </div>
                    </div>

                    {/* Detailed Cards for 13 Attributes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* 1. Cliente & Pedido */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          <span>1. Cliente y Pedido</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{demoCase.customer.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {demoCase.customer.customer_id}</div>
                          <div className="text-[11px] text-slate-400">{demoCase.customer.delivery_address}</div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80 flex justify-between text-[11px]">
                          <span className="text-slate-400">Entregado hace:</span>
                          <span className="font-mono text-slate-300">{demoCase.order_data.delivered_at_hours_ago} hora(s)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Total pedido:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${demoCase.total_order_amount} {demoCase.order_data.currency}
                          </span>
                        </div>
                      </div>

                      {/* 2. Comercio & Producto */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                          <span>2. Comercio y Producto Afectado</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{demoCase.merchant.name}</div>
                          <div className="text-[11px] text-slate-400">{demoCase.merchant.category} • {demoCase.merchant.zone}</div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80">
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

                      {/* 3. Reclamo & Motivo */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
                          <Tag className="w-3.5 h-3.5 text-rose-400" />
                          <span>3. Motivo y Relato del Reclamo</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Motivo elegido en menú:</span>
                          <div className="font-mono text-xs text-rose-300 font-semibold">"{demoCase.claim_reason_menu}"</div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80">
                          <span className="text-slate-400 text-[11px]">Descripción del cliente:</span>
                          <div className="text-[11px] text-slate-300 italic bg-slate-950 p-2 rounded border border-slate-800">
                            "{demoCase.customer_claim_description}"
                          </div>
                        </div>
                      </div>

                      {/* 4. Evidencia */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
                          <Camera className="w-3.5 h-3.5 text-purple-400" />
                          <span>4. Evidencia y Suficiencia</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Estado de evidencia:</span>
                          <span className="font-mono font-bold text-slate-200">{demoCase.evidence.evaluation_status}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">¿Suficiente?:</span>
                          <span className={`font-semibold ${demoCase.evidence.is_sufficient ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {demoCase.evidence.is_sufficient ? 'Sí' : 'No / Contradice'}
                          </span>
                        </div>
                        {demoCase.evidence.photo_description && (
                          <div className="text-[11px] text-slate-400 bg-slate-950 p-1.5 rounded italic">
                            {demoCase.evidence.photo_description}
                          </div>
                        )}
                      </div>

                      {/* 5. Análisis & Resolución */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>5. Análisis y Fundamento</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Decisión prevista:</span>
                          <span className="font-mono font-bold text-rose-300">{demoCase.expected_resolution.decision}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Importe propuesto:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {demoCase.expected_resolution.proposed_amount !== null
                              ? `$${demoCase.expected_resolution.proposed_amount} ${demoCase.expected_resolution.currency}`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                          <strong>Fundamento:</strong> {demoCase.expected_resolution.rationale}
                        </div>
                      </div>

                      {/* 6. Devolución & Mensaje al Cliente */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1">
                          <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                          <span>6. Devolución y Mensaje</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Elección de devolución:</span>
                          <span className="text-slate-200 font-medium">{demoCase.refund_options.choice_description}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Estado devolución:</span>
                          <span className="font-mono text-rose-400 uppercase">{demoCase.refund_status}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                          {demoCase.customer_message}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
