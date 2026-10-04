import type { DemoCaseRecord } from '../types/demoCase.ts';
import { DEFAULT_DEMO_CASES } from '../data/demoCasesData.ts';

const STORAGE_KEY = 'ort_pedidosya_demo_cases_v2';

/**
 * Obtiene la lista completa de casos de demostración persistidos.
 */
export function getStoredDemoCases(): DemoCaseRecord[] {
  if (typeof window === 'undefined') {
    return DEFAULT_DEMO_CASES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_CASES));
      return DEFAULT_DEMO_CASES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading demo cases from localStorage, using defaults:', err);
  }

  return DEFAULT_DEMO_CASES;
}

/**
 * Guarda la colección completa de casos de demostración en localStorage.
 */
export function saveDemoCases(cases: DemoCaseRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.error('Error saving demo cases to localStorage:', err);
  }
}

/**
 * Restablece los casos a los valores predeterminados de fábrica.
 */
export function resetDemoCasesToDefault(): DemoCaseRecord[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_CASES));
  }
  return DEFAULT_DEMO_CASES;
}

/**
 * Búsqueda inteligente y flexible de casos por:
 * - Nombre (ej: "Helado", "Caso A", "Milanesa", "Flan")
 * - Número (ej: "A", "B", "C", "1", "2", "8", "10")
 * - Identificador único (ej: "CASO-A", "SYN-CASE-003", "SYN-ORDER-005")
 */
export function findDemoCase(
  query: string,
  casesList: DemoCaseRecord[] = getStoredDemoCases()
): DemoCaseRecord | null {
  if (!query || !query.trim()) return null;

  const q = query.trim().toLowerCase();

  // 1. Coincidencia exacta por ID o Case Number
  const exactMatch = casesList.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.case_number.toLowerCase() === q ||
      c.order_data.order_id.toLowerCase() === q ||
      c.claim_input_payload.case_id.toLowerCase() === q
  );
  if (exactMatch) return exactMatch;

  // 2. Normalización de formato "caso X" o "caso #"
  const normalizedCaseNum = q.replace(/^caso\s*[-_:]?\s*/i, '').trim();
  if (normalizedCaseNum) {
    const numMatch = casesList.find(
      (c) =>
        c.case_number.toLowerCase() === normalizedCaseNum ||
        c.id.toLowerCase() === `caso-${normalizedCaseNum}` ||
        c.id.toLowerCase().endsWith(normalizedCaseNum)
    );
    if (numMatch) return numMatch;
  }

  // 3. Coincidencia por nombre o producto o descripción
  const textMatch = casesList.find(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.claimed_product.name.toLowerCase().includes(q) ||
      c.merchant.name.toLowerCase().includes(q) ||
      c.customer.name.toLowerCase().includes(q) ||
      c.expected_resolution.decision.toLowerCase().includes(q) ||
      c.analysis_result.matched_rules.some((r) => r.toLowerCase().includes(q)) ||
      c.analysis_result.matched_guards.some((g) => g.toLowerCase().includes(q))
  );
  if (textMatch) return textMatch;

  return null;
}

/**
 * Agrega o actualiza un caso en el almacén persistente.
 */
export function upsertDemoCase(record: DemoCaseRecord): DemoCaseRecord[] {
  const current = getStoredDemoCases();
  const existingIdx = current.findIndex((c) => c.id === record.id);

  let updated: DemoCaseRecord[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...record,
      updated_at: new Date().toISOString(),
    };
  } else {
    updated = [
      {
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...current,
    ];
  }

  saveDemoCases(updated);
  return updated;
}

/**
 * Elimina un caso por su ID.
 */
export function deleteDemoCase(caseId: string): DemoCaseRecord[] {
  const current = getStoredDemoCases();
  const filtered = current.filter((c) => c.id !== caseId);
  saveDemoCases(filtered);
  return filtered;
}
