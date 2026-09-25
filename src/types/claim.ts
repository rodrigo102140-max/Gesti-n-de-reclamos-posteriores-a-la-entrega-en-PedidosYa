/**
 * Esquema oficial del agente de resolución de reclamos post-entrega.
 * PROTOTIPO ACADÉMICO - Universidad ORT Uruguay (Caso PedidosYa, datos sintéticos).
 */

export type ClaimType =
  | 'missing_item'
  | 'delayed_order'
  | 'damaged_product'
  | 'wrong_item'
  | 'refund_delay'
  | 'unclear'
  | 'other';

export type EvidenceStatus =
  | 'not_required'
  | 'not_provided'
  | 'supports_claim'
  | 'contradicts_claim'
  | 'insufficient'
  | 'unclear';

export type Decision =
  | 'proposed_refund'
  | 'proposed_coupon'
  | 'request_more_information'
  | 'human_review'
  | 'no_compensation';

export type HumanReviewReasonCode =
  | 'missing_required_field'
  | 'order_not_found'
  | 'order_not_delivered'
  | 'product_not_in_order'
  | 'ambiguous_product_match'
  | 'low_classifier_confidence'
  | 'evidence_contradicts_description'
  | 'claim_type_not_covered'
  | 'customer_disputes_previous_resolution'
  | 'outside_claim_window'
  | 'amount_above_auto_limit'
  | 'no_matching_rule'
  | 'conflicting_rules'
  | 'rule_requires_human_review'
  | 'invalid_agent_output';

export type AffectedAmountBand = 'low' | 'medium' | 'high';

export interface AffectedItem {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
  amount: number; // qty x unit_price
}

export interface SyntheticOrderItem {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
}

export interface PreviousResolution {
  status: 'pending' | 'approved' | 'rejected' | string;
  type?: 'refund' | 'coupon' | string;
  amount?: number;
  date_iso?: string;
  details?: string;
}

export interface SyntheticOrder {
  order_id: string; // formato SYN-ORDER-XXX
  items: SyntheticOrderItem[];
  previous_resolution?: PreviousResolution | null;
  delivered_at_hours_ago?: number;
}

export interface SyntheticClaimInput {
  case_id: string; // formato SYN-CASE-XXX
  order_id: string; // formato SYN-ORDER-XXX
  order: SyntheticOrder;
  menu_reason: string; // Motivo en menú de ayuda
  claimed_product_name: string; // Nombre del producto según el cliente
  customer_description: string; // Texto libre del cliente
  visual_evidence?: {
    image_url?: string;
    image_base64?: string;
    description?: string; // Descripción sintética o percibida
  } | null;
  hours_since_delivery: number;
  customer_disputes_previous_resolution: boolean;
}

/**
 * Salida estructurada oficial del agente, exactamente según el OpenAPI JSON Schema de ORT.
 */
export interface AgentStructuredOutput {
  case_id: string;
  order_id: string;
  claim_type: ClaimType;
  affected_items: AffectedItem[];
  evidence_received: boolean;
  evidence_status: EvidenceStatus;
  evidence_observations: string[];
  decision: Decision;
  proposed_resolution: string;
  proposed_amount: number | null;
  currency: 'UYU';
  requires_human_review: boolean;
  human_review_reason: HumanReviewReasonCode[];
  rules_applied: string[]; // ['SIM_RULE_001'] o ['SIM_GUARD_001'] etc.
  customer_message: string;
  confidence_note: string;
  executed: false;
}

export interface GuardEvaluationDetail {
  guard_id: 'SIM_GUARD_001' | 'SIM_GUARD_002' | 'SIM_GUARD_003' | 'SIM_GUARD_004' | 'SIM_GUARD_005' | 'SIM_GUARD_006';
  name: string;
  condition_met: boolean;
  reason_if_met: HumanReviewReasonCode;
  details: string;
}

export interface BenchmarkCase {
  id: string;
  title: string;
  category: 'Guardas' | 'Reglas' | 'Casos Borde';
  expected_rule_or_guard: string;
  expected_decision: Decision;
  expected_review_reason?: HumanReviewReasonCode;
  description: string;
  input: SyntheticClaimInput;
}
