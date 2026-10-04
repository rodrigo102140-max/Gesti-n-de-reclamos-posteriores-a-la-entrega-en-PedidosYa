import type {
  ClaimType,
  EvidenceStatus,
  Decision,
  HumanReviewReasonCode,
  AffectedAmountBand,
  SyntheticClaimInput,
  PreviousResolution,
} from './claim.ts';

/**
 * Estructura oficial del Registro Persistente de Casos de Demostración
 * PROTOTIPO ACADÉMICO - Universidad ORT Uruguay (Caso PedidosYa).
 * Cumple exhaustivamente con los 13 atributos requeridos.
 */
export interface DemoCaseRecord {
  // 1. Identificador único, nombre y descripción del caso
  id: string; // Ej: 'CASO-A', 'CASO-B', 'CASO-C', 'CASO-2', 'BENCH-01'
  case_number: string; // Ej: 'A', 'B', 'C', '1', '2', '3', etc.
  name: string; // Nombre descriptivo del caso
  description: string; // Resumen ejecutivo / hipótesis de prueba

  // 2. Cliente y datos del pedido
  customer: {
    customer_id: string;
    name: string;
    phone?: string;
    email?: string;
    delivery_address?: string;
  };
  order_data: {
    order_id: string;
    delivered: boolean;
    delivered_at_hours_ago: number;
    order_timestamp?: string;
    items: {
      product_id: string;
      name: string;
      qty: number;
      unit_price: number;
      total_price: number;
    }[];
    total_amount: number;
    currency: 'UYU';
    previous_resolution?: PreviousResolution | null;
  };

  // 3. Comercio, producto afectado, importe total e importe afectado
  merchant: {
    merchant_id: string;
    name: string;
    category: string;
    zone?: string;
  };
  claimed_product: {
    product_id: string;
    name: string;
    qty: number;
    unit_price: number;
    affected_amount: number;
  };
  total_order_amount: number;
  total_affected_amount: number;

  // 4. Motivo y descripción del reclamo
  claim_reason_menu: string; // Motivo seleccionado en menú de ayuda
  customer_claim_description: string; // Relato textual del cliente
  customer_disputes_previous: boolean;

  // 5. Evidencia disponible y si es suficiente
  evidence: {
    has_evidence: boolean;
    evidence_type: 'photo' | 'receipt' | 'none';
    photo_description?: string;
    photo_url?: string;
    is_sufficient: boolean;
    evaluation_status: EvidenceStatus;
    observations: string[];
  };

  // 6. Estado del reclamo y paso actual
  claim_status: 'recibido' | 'en_analisis' | 'resuelto' | 'derivado_humano' | 'cerrado';
  current_step: {
    step_number: 1 | 2 | 3 | 4;
    step_name:
      | 'Recepción y Clasificación'
      | 'Validación de Guardas'
      | 'Evaluación de Reglas'
      | 'Resolución y Notificación';
    status: 'completed' | 'in_progress' | 'blocked';
    details: string;
  };

  // 7. Resultado del análisis
  analysis_result: {
    detected_claim_type: ClaimType;
    confidence: number;
    amount_band: AffectedAmountBand;
    matched_guards: string[];
    matched_rules: string[];
  };

  // 8. Resolución prevista y su fundamento
  expected_resolution: {
    decision: Decision;
    resolution_label: string;
    proposed_amount: number | null;
    currency: 'UYU';
    rationale: string; // Fundamento normativo de la regla o guarda
  };

  // 9. Necesidad de intervención humana
  human_intervention: {
    required: boolean;
    reasons: HumanReviewReasonCode[];
    escalation_priority: 'none' | 'low' | 'medium' | 'high' | 'immediate';
    analyst_note?: string;
  };

  // 10. Opciones de devolución y elección del cliente
  refund_options: {
    available_methods: ('original_payment_method' | 'wallet_credits' | 'replacement' | 'none')[];
    customer_choice: 'original_payment_method' | 'wallet_credits' | 'replacement' | 'none' | 'pending';
    choice_description: string;
  };

  // 11. Estado de la devolución
  refund_status:
    | 'propuesta_simulada'
    | 'no_aplica'
    | 'derivada_a_agente'
    | 'pendiente_confirmacion'
    | 'completada_simulada';

  // 12. Mensaje que debe recibir el cliente
  customer_message: string;

  // 13. Origen de los datos
  data_source: string;

  // Payload de ejecución directa en el motor
  claim_input_payload: SyntheticClaimInput;

  // Metadatos de auditoría
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}
