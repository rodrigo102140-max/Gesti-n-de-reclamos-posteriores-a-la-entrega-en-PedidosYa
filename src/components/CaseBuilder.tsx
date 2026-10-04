import React, { useState } from 'react';
import {
  Package,
  Clock,
  AlertOctagon,
  Image as ImageIcon,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Send,
  Upload,
} from 'lucide-react';
import { SyntheticClaimInput, SyntheticOrderItem } from '../types/claim';
import { BENCHMARK_CASES } from '../data/benchmarkCases';
import { DEFAULT_DEMO_CASES } from '../data/demoCasesData';

interface CaseBuilderProps {
  currentInput: SyntheticClaimInput;
  onChangeInput: (newInput: SyntheticClaimInput) => void;
  onEvaluate: () => void;
  isLoading: boolean;
}

export const CaseBuilder: React.FC<CaseBuilderProps> = ({
  currentInput,
  onChangeInput,
  onEvaluate,
  isLoading,
}) => {
  const [useCustomProductName, setUseCustomProductName] = useState(false);

  // Carga un caso preset desde los casos de demostración o benchmarks
  const handleLoadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const demoFound = DEFAULT_DEMO_CASES.find((d) => d.id === selectedId);
    if (demoFound) {
      onChangeInput(JSON.parse(JSON.stringify(demoFound.claim_input_payload)));
      return;
    }
    const found = BENCHMARK_CASES.find((b) => b.id === selectedId);
    if (found) {
      onChangeInput(JSON.parse(JSON.stringify(found.input)));
    }
  };

  // Modifica un campo directo del input
  const updateField = <K extends keyof SyntheticClaimInput>(
    field: K,
    val: SyntheticClaimInput[K]
  ) => {
    onChangeInput({
      ...currentInput,
      [field]: val,
    });
  };

  // Modifica ítems del pedido
  const handleItemChange = (index: number, field: keyof SyntheticOrderItem, val: any) => {
    const updatedItems = [...currentInput.order.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'qty' || field === 'unit_price' ? Number(val) : val,
    };
    onChangeInput({
      ...currentInput,
      order: {
        ...currentInput.order,
        items: updatedItems,
      },
    });
  };

  const handleAddItem = () => {
    const newItem: SyntheticOrderItem = {
      product_id: `PRD-${Math.floor(Math.random() * 900 + 100)}`,
      name: 'Nuevo Producto Sintético',
      qty: 1,
      unit_price: 300,
    };
    onChangeInput({
      ...currentInput,
      order: {
        ...currentInput.order,
        items: [...currentInput.order.items, newItem],
      },
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = currentInput.order.items.filter((_, i) => i !== index);
    onChangeInput({
      ...currentInput,
      order: {
        ...currentInput.order,
        items: updatedItems,
      },
    });
  };

  // Preset visual rápido
  const setVisualPreset = (desc: string | null) => {
    onChangeInput({
      ...currentInput,
      visual_evidence: desc ? { description: desc } : null,
    });
  };

  // Subir imagen base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChangeInput({
          ...currentInput,
          visual_evidence: {
            image_base64: reader.result as string,
            description: 'Imagen adjunta por el usuario para análisis visual.',
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const totalOrderAmount = currentInput.order.items.reduce(
    (acc, it) => acc + it.qty * it.unit_price,
    0
  );

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Editor de Caso Sintético
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Cargar caso:</span>
          <select
            onChange={handleLoadPreset}
            defaultValue=""
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:ring-1 focus:ring-rose-500 focus:outline-none"
          >
            <option value="" disabled>
              Seleccionar caso...
            </option>
            <optgroup label="Casos de Demostración">
              {DEFAULT_DEMO_CASES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} - {d.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Suite de Benchmarks">
              {BENCHMARK_CASES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} - {b.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[700px] overflow-y-auto text-xs text-slate-300">
        {/* Identificadores Sintéticos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Case ID (SYN-CASE-XXX):
            </label>
            <input
              type="text"
              value={currentInput.case_id}
              onChange={(e) => updateField('case_id', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Order ID (SYN-ORDER-XXX):
            </label>
            <input
              type="text"
              value={currentInput.order_id}
              onChange={(e) => {
                const val = e.target.value;
                onChangeInput({
                  ...currentInput,
                  order_id: val,
                  order: { ...currentInput.order, order_id: val },
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Líneas del Pedido Sintético */}
        <div className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 text-xs">
              Líneas del Pedido Sintético ({currentInput.order.items.length} productos)
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Total Pedido: ${totalOrderAmount} UYU
            </span>
          </div>

          <div className="space-y-1.5">
            {currentInput.order.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-1.5 items-center bg-slate-900 p-1.5 rounded border border-slate-800/80"
              >
                <div className="col-span-3 font-mono">
                  <input
                    type="text"
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-300"
                    placeholder="ID"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200"
                    placeholder="Nombre"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 font-mono text-center"
                    placeholder="Cant"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 font-mono text-right"
                    placeholder="$ Unit"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    disabled={currentInput.order.items.length <= 1}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddItem}
            className="flex items-center space-x-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium pt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar ítem al pedido</span>
          </button>
        </div>

        {/* Motivo de Menú y Producto Reclamado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Motivo seleccionado en Menú "Ayuda":
            </label>
            <select
              value={currentInput.menu_reason}
              onChange={(e) => updateField('menu_reason', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-rose-500 focus:outline-none"
            >
              <option value="Producto faltante">Producto faltante</option>
              <option value="Producto roto o dañado">Producto roto o dañado</option>
              <option value="Producto equivocado">Producto equivocado</option>
              <option value="Demora en la entrega">Demora en la entrega</option>
              <option value="Demora en la devolución">Demora en la devolución</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Producto Reclamado por el Cliente:
              </label>
              <button
                type="button"
                onClick={() => setUseCustomProductName(!useCustomProductName)}
                className="text-[10px] text-amber-400 hover:underline"
              >
                {useCustomProductName ? 'Seleccionar de la lista' : 'Probar producto ajeno'}
              </button>
            </div>

            {useCustomProductName ? (
              <input
                type="text"
                value={currentInput.claimed_product_name}
                onChange={(e) => updateField('claimed_product_name', e.target.value)}
                placeholder="Ej: Sushi Roll 15u (para probar producto ajeno)"
                className="w-full bg-slate-950 border border-amber-500/50 rounded px-2.5 py-1.5 text-amber-200 text-xs focus:outline-none"
              />
            ) : (
              <select
                value={currentInput.claimed_product_name}
                onChange={(e) => updateField('claimed_product_name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-rose-500 focus:outline-none"
              >
                {currentInput.order.items.map((it) => (
                  <option key={it.product_id} value={it.name}>
                    {it.name} (${it.unit_price} UYU)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Descripción libre del cliente */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Descripción escrita por el cliente (Texto libre):
          </label>
          <textarea
            rows={2}
            value={currentInput.customer_description}
            onChange={(e) => updateField('customer_description', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs focus:border-rose-500 focus:outline-none leading-relaxed"
            placeholder="Detalles provistos por el usuario..."
          />
        </div>

        {/* Parámetros de Guarda: Tiempo y Disputa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Horas transcurridas desde entrega:
              </label>
              <span
                className={`font-mono text-xs font-bold ${
                  currentInput.hours_since_delivery <= 48 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentInput.hours_since_delivery} horas {currentInput.hours_since_delivery > 48 ? '(Excede 48h)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="72"
              value={currentInput.hours_since_delivery}
              onChange={(e) => updateField('hours_since_delivery', Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center space-x-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={currentInput.customer_disputes_previous_resolution}
                onChange={(e) =>
                  updateField('customer_disputes_previous_resolution', e.target.checked)
                }
                className="w-4 h-4 accent-rose-500 rounded"
              />
              <span className="text-xs text-slate-300">
                Cliente cuestiona resolución previa (<code className="text-rose-400 font-mono">SIM_GUARD_003</code>)
              </span>
            </label>
          </div>
        </div>

        {/* Evidencia Visual */}
        <div className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300 text-xs">
                Evidencia Visual Sintética
              </span>
            </div>
            <label className="cursor-pointer text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1">
              <Upload className="w-3 h-3" />
              <span>Adjuntar imagen real</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setVisualPreset(null)}
              className={`px-2 py-0.5 rounded text-[10px] ${
                !currentInput.visual_evidence
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Sin foto (not_provided)
            </button>
            <button
              type="button"
              onClick={() =>
                setVisualPreset(
                  'Se observa un pote con tapa desprendida y líquido derramado en la bolsa.'
                )
              }
              className={`px-2 py-0.5 rounded text-[10px] ${
                currentInput.visual_evidence?.description?.includes('derramado')
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Foto consistente (supports_claim)
            </button>
            <button
              type="button"
              onClick={() =>
                setVisualPreset(
                  'Se observa una caja abierta con la pizza intacta, muzzarella uniforme y sin roturas ni daños.'
                )
              }
              className={`px-2 py-0.5 rounded text-[10px] ${
                currentInput.visual_evidence?.description?.includes('intacta')
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Foto contradice reclamo (contradicts_claim)
            </button>
            <button
              type="button"
              onClick={() =>
                setVisualPreset(
                  'Fotografía oscura, desenfocada e ilegible donde no se aprecia el producto.'
                )
              }
              className={`px-2 py-0.5 rounded text-[10px] ${
                currentInput.visual_evidence?.description?.includes('desenfocada')
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Foto ilegible (insufficient)
            </button>
          </div>

          {currentInput.visual_evidence && (
            <textarea
              rows={2}
              value={currentInput.visual_evidence.description || ''}
              onChange={(e) =>
                onChangeInput({
                  ...currentInput,
                  visual_evidence: {
                    ...currentInput.visual_evidence,
                    description: e.target.value,
                  },
                })
              }
              placeholder="Descripción de lo que muestra la evidencia fotográfica..."
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-[11px] focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-800/80 p-4 border-t border-slate-700/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Prototipo de decisión simulada (<code className="text-rose-400">executed: false</code>)
        </span>
        <button
          onClick={onEvaluate}
          disabled={isLoading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Evaluando...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Ejecutar Resolución</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
