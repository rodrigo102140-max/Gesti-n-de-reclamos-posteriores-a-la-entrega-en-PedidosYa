/**
 * Motor de evaluación y reglas simuladas para reclamos post-entrega.
 * Prototipo Académico - Universidad ORT Uruguay (Caso de estudio: PedidosYa).
 * Salida estricta conforme al OpenAPI JSON Schema del agente.
 */

import {
  SyntheticClaimInput,
  AgentStructuredOutput,
  ClaimType,
  EvidenceStatus,
  Decision,
  HumanReviewReasonCode,
  AffectedAmountBand,
  AffectedItem,
  GuardEvaluationDetail,
} from '../types/claim';

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * 1. Clasificación: parte del motivo de menú pero contrasta con el texto libre.
 */
export function classifyClaim(
  menuReason: string,
  customerText: string
): { claim_type: ClaimType; confidence: number; notes: string } {
  const normMenu = normalize(menuReason);
  const normText = normalize(customerText);

  let candidateType: ClaimType = 'other';
  if (
    normMenu.includes('faltan') ||
    normMenu.includes('falto') ||
    normMenu.includes('incompleto') ||
    normMenu.includes('falta')
  ) {
    candidateType = 'missing_item';
  } else if (
    normMenu.includes('dan') ||
    normMenu.includes('rot') ||
    normMenu.includes('derram') ||
    normMenu.includes('aplast')
  ) {
    candidateType = 'damaged_product';
  } else if (
    normMenu.includes('equivoc') ||
    normMenu.includes('distinto') ||
    normMenu.includes('otro producto') ||
    normMenu.includes('diferente')
  ) {
    candidateType = 'wrong_item';
  } else if (normMenu.includes('demora') && (normMenu.includes('pedido') || normMenu.includes('entrega'))) {
    candidateType = 'delayed_order';
  } else if (normMenu.includes('devolucion') || normMenu.includes('reembolso') || normMenu.includes('acredit')) {
    candidateType = 'refund_delay';
  } else if (normMenu.includes('otro') || normMenu.includes('consulta')) {
    candidateType = 'other';
  } else {
    candidateType = 'unclear';
  }

  const hasDamageWords = /rot|dan|derram|aplast|abiert|chorre|incomible|fisur/i.test(normText);
  const hasWrongWords = /equivoc|no es lo que pedi|otra cosa|distinto|vino con|mandaron otr/i.test(normText);
  const hasMissingWords = /falto|no vino|no llego|olvidaron|falta|no me trajeron/i.test(normText);

  let confidence = 0.95;
  let notes = 'El texto del cliente es consistente con el motivo seleccionado en el menú.';

  if (candidateType === 'missing_item' && hasDamageWords && !hasMissingWords) {
    confidence = 0.40;
    notes = 'Inconsistencia detectada: menú indica faltante pero el cliente describe daño o derrame.';
  } else if (candidateType === 'damaged_product' && hasMissingWords && !hasDamageWords) {
    confidence = 0.45;
    notes = 'Inconsistencia detectada: menú indica daño pero el cliente describe que el producto no vino.';
  } else if (candidateType === 'delayed_order' && (hasDamageWords || hasWrongWords)) {
    confidence = 0.50;
    notes = 'Inconsistencia detectada: menú indica demora pero el texto reclama calidad o contenido del producto.';
  } else if (normText.length < 5 && candidateType !== 'other') {
    confidence = 0.55;
    notes = 'Texto del cliente demasiado escueto para convalidar el motivo elegido.';
  }

  return { claim_type: candidateType, confidence, notes };
}

/**
 * 2. Identificación estricta del producto dentro de las líneas del pedido sintetico.
 */
export function matchClaimedProduct(
  claimedName: string,
  items: SyntheticClaimInput['order']['items']
): { matches: AffectedItem[]; error: HumanReviewReasonCode | null } {
  if (!claimedName || !claimedName.trim()) {
    return { matches: [], error: 'missing_required_field' };
  }

  const normClaimed = normalize(claimedName);

  // Coincidencia exacta por ID o nombre
  const exact = items.filter(
    (item) => normalize(item.product_id) === normClaimed || normalize(item.name) === normClaimed
  );
  if (exact.length === 1) {
    const item = exact[0];
    return {
      matches: [
        {
          product_id: item.product_id,
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          amount: item.qty * item.unit_price,
        },
      ],
      error: null,
    };
  }

  // Coincidencia parcial
  const partial = items.filter(
    (item) =>
      normalize(item.name).includes(normClaimed) || normClaimed.includes(normalize(item.name))
  );

  if (partial.length === 1) {
    const item = partial[0];
    return {
      matches: [
        {
          product_id: item.product_id,
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          amount: item.qty * item.unit_price,
        },
      ],
      error: null,
    };
  }

  if (partial.length > 1) {
    return { matches: [], error: 'ambiguous_product_match' };
  }

  return { matches: [], error: 'product_not_in_order' };
}

/**
 * 3. Percepción visual y traducción a evidence_status.
 * Percepción describe lo visual frase a frase en un array de strings.
 * NO contiene montos, culpas, devoluciones ni fraude.
 */
export function evaluateEvidenceStatus(
  claimType: ClaimType,
  _customerText: string,
  visualEvidence?: SyntheticClaimInput['visual_evidence']
): { status: EvidenceStatus; observations: string[]; evidence_received: boolean } {
  const hasEvidence = Boolean(
    visualEvidence && (visualEvidence.image_url || visualEvidence.image_base64 || visualEvidence.description)
  );

  if (claimType === 'missing_item' || claimType === 'refund_delay') {
    return {
      status: 'not_required',
      observations: hasEvidence && visualEvidence?.description ? [visualEvidence.description] : [],
      evidence_received: hasEvidence,
    };
  }

  if (!hasEvidence) {
    return {
      status: 'not_provided',
      observations: [],
      evidence_received: false,
    };
  }

  const desc = normalize(visualEvidence?.description || '');
  const observationPhrases: string[] = [];

  if (desc.includes('borrosa') || desc.includes('oscura') || desc.includes('cortada') || desc.includes('ilegible')) {
    observationPhrases.push('La imagen presenta desenfoque y baja iluminación que impiden distinguir el estado del producto.');
    return {
      status: 'insufficient',
      observations: observationPhrases,
      evidence_received: true,
    };
  }

  if (
    desc.includes('no muestra el producto') ||
    desc.includes('otro objeto') ||
    desc.includes('fondo') ||
    desc.includes('mesa vacia')
  ) {
    observationPhrases.push('La toma fotográfica muestra una superficie u objeto ajeno al artículo indicado en el reclamo.');
    return {
      status: 'unclear',
      observations: observationPhrases,
      evidence_received: true,
    };
  }

  if (
    desc.includes('intacto') ||
    desc.includes('perfecto estado') ||
    desc.includes('sin danos') ||
    desc.includes('sellado') ||
    desc.includes('coincide exactamente') ||
    desc.includes('sin roturas')
  ) {
    observationPhrases.push('Se aprecia el empaque original completamente cerrado y sin deformaciones visibles.');
    observationPhrases.push('No se evidencian pérdidas de contenido, fisuras ni roturas en el contenedor.');
    return {
      status: 'contradicts_claim',
      observations: observationPhrases,
      evidence_received: true,
    };
  }

  if (
    desc.includes('roto') ||
    desc.includes('derramado') ||
    desc.includes('abierto') ||
    desc.includes('aplastado') ||
    desc.includes('equivocado') ||
    desc.includes('diferente') ||
    desc.includes('dano') ||
    desc.includes('fisura')
  ) {
    observationPhrases.push(
      visualEvidence?.description ||
        'Se observa el producto con tapa desprendida y derrame visible de contenido en la bolsa contenedora.'
    );
    return {
      status: 'supports_claim',
      observations: observationPhrases,
      evidence_received: true,
    };
  }

  // Duda -> nunca supports_claim
  observationPhrases.push(visualEvidence?.description || 'Evidencia no concluyente respecto al estado reportado.');
  return {
    status: 'unclear',
    observations: observationPhrases,
    evidence_received: true,
  };
}

/**
 * Redacta el mensaje al cliente en español rioplatense conciso con el descargo obligatorio.
 */
function buildCustomerMessage(
  decision: Decision,
  amount: number | null,
  humanReason: HumanReviewReasonCode | null
): string {
  const disclaimer = '[PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]';

  switch (decision) {
    case 'proposed_refund':
      return `Hola, lamentamos el inconveniente con tu pedido. De acuerdo a las condiciones del caso, te proponemos la devolución de $${amount} UYU por el producto afectado. ${disclaimer}`;

    case 'proposed_coupon':
      return `Hola, te pedimos disculpas por la falta en tu entrega. Te proponemos un cupón de compensación por valor de $${amount} UYU para tu próxima compra. ${disclaimer}`;

    case 'request_more_information':
      return `Hola, para poder evaluar tu reclamo necesitamos que nos envíes una foto clara y legible donde se aprecie el estado del producto afectado. Quedamos a la espera de la imagen. ${disclaimer}`;

    case 'no_compensation':
      return `Hola, te informamos que tu solicitud de devolución previa ya fue registrada y el plazo de acreditación efectivo depende exclusivamente de tu entidad bancaria o medio de pago. No corresponde una nueva compensación. ${disclaimer}`;

    case 'human_review':
    default: {
      let detalle = 'un representante de nuestro equipo revisará tu caso';
      if (humanReason === 'outside_claim_window') {
        detalle = 'el reclamo fue ingresado fuera de la ventana horaria prevista y pasará a revisión manual';
      } else if (humanReason === 'amount_above_auto_limit') {
        detalle = 'el importe involucrado excede el límite de resolución automática y debe ser evaluado por un supervisor';
      } else if (humanReason === 'customer_disputes_previous_resolution') {
        detalle = 'al tratarse de una reapertura o disconformidad con una resolución anterior, un analista examinará el caso';
      } else if (humanReason === 'evidence_contradicts_description') {
        detalle = 'se detectaron diferencias entre la información provista y la evidencia adjunta, por lo que un agente intervendrá para validar el reclamo';
      } else if (humanReason === 'product_not_in_order') {
        detalle = 'el artículo reclamado no figura registrado en las líneas del pedido entregado y será revisado manualmente';
      }
      return `Hola, recibimos tu solicitud. Para brindarte una respuesta precisa, ${detalle}. Nos comunicaremos a la brevedad. ${disclaimer}`;
    }
  }
}

function buildProposedResolutionText(
  decision: Decision,
  amount: number | null,
  ruleOrGuard: string | null,
  reason: HumanReviewReasonCode | null
): string {
  switch (decision) {
    case 'proposed_refund':
      return `Devolución propuesta por $${amount} UYU (${ruleOrGuard}).`;
    case 'proposed_coupon':
      return `Cupón de compensación propuesto por $${amount} UYU (${ruleOrGuard}).`;
    case 'request_more_information':
      return `Solicitud de fotografía legible del producto afectado (${ruleOrGuard}).`;
    case 'no_compensation':
      return `Sin compensación adicional por encontrarse trámite de reembolso ya en curso (${ruleOrGuard}).`;
    case 'human_review':
    default:
      return `Derivación a revisión humana por motivo: ${reason || 'criterio simulado'} (${ruleOrGuard || 'SIM_GUARD'}).`;
  }
}

/**
 * Evaluación completa del reclamo sintético produciendo la salida estructurada oficial.
 */
export function evaluateSyntheticClaim(input: SyntheticClaimInput): AgentStructuredOutput {
  const case_id = input.case_id || 'SYN-CASE-001';
  const order_id = input.order_id || input.order?.order_id || 'SYN-ORDER-001';

  // 1. Clasificación
  const { claim_type, confidence, notes: classifier_notes } = classifyClaim(
    input.menu_reason,
    input.customer_description
  );
  const classifier_confidence_ok = confidence >= 0.6;

  // 2. Identificación del producto en las líneas del pedido
  let affected_items: AffectedItem[] = [];
  let productMatchError: HumanReviewReasonCode | null = null;

  if (claim_type !== 'refund_delay' && claim_type !== 'delayed_order') {
    const matchResult = matchClaimedProduct(input.claimed_product_name, input.order?.items || []);
    if (matchResult.error) {
      productMatchError = matchResult.error;
    } else {
      affected_items = matchResult.matches;
    }
  }

  // 3. Percepción visual
  const {
    status: evidence_status,
    observations: evidence_observations,
    evidence_received,
  } = evaluateEvidenceStatus(claim_type, input.customer_description, input.visual_evidence);

  // 4. Cálculo de importe y banda
  const affected_sum = affected_items.reduce((acc, item) => acc + item.amount, 0);
  const affected_amount = affected_items.length > 0 ? affected_sum : null;

  let affected_amount_band: AffectedAmountBand = 'low';
  if (affected_amount !== null) {
    if (affected_amount <= 400) {
      affected_amount_band = 'low';
    } else if (affected_amount <= 600) {
      affected_amount_band = 'medium';
    } else {
      affected_amount_band = 'high';
    }
  }

  const claim_within_window = input.hours_since_delivery <= 48;

  // Caso: Producto reclamado no está en el pedido
  if (productMatchError) {
    const decision: Decision = 'human_review';
    const reason = productMatchError;
    return {
      case_id,
      order_id,
      claim_type,
      affected_items: [],
      evidence_received,
      evidence_status,
      evidence_observations,
      decision,
      proposed_resolution: buildProposedResolutionText(decision, null, null, reason),
      proposed_amount: null,
      currency: 'UYU',
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: [],
      customer_message: buildCustomerMessage(decision, null, reason),
      confidence_note: `No fue posible encontrar el producto '${input.claimed_product_name}' entre los ítems del pedido sintético. Se deriva a revisión humana.`,
      executed: false,
    };
  }

  // 5. Fase A: GUARDAS (se evalúan en estricto orden)
  const guard_evaluations: GuardEvaluationDetail[] = [
    {
      guard_id: 'SIM_GUARD_001',
      name: 'Evidencia contradice descripción',
      condition_met: evidence_status === 'contradicts_claim',
      reason_if_met: 'evidence_contradicts_description',
      details: 'La evidencia visual contradice lo descripto por el cliente.',
    },
    {
      guard_id: 'SIM_GUARD_002',
      name: 'Tipo de reclamo no cubierto',
      condition_met: ['other', 'unclear', 'delayed_order'].includes(claim_type),
      reason_if_met: 'claim_type_not_covered',
      details: `El motivo '${claim_type}' no cuenta con política automática definida.`,
    },
    {
      guard_id: 'SIM_GUARD_003',
      name: 'Cliente cuestiona resolución previa',
      condition_met: input.customer_disputes_previous_resolution === true,
      reason_if_met: 'customer_disputes_previous_resolution',
      details: 'El cliente disputa la resolución previa.',
    },
    {
      guard_id: 'SIM_GUARD_004',
      name: 'Fuera de ventana de reclamo (48h)',
      condition_met: !claim_within_window,
      reason_if_met: 'outside_claim_window',
      details: `Reclamo abierto a las ${input.hours_since_delivery} horas (límite: 48 horas).`,
    },
    {
      guard_id: 'SIM_GUARD_005',
      name: 'Importe superior al tope automático',
      condition_met: affected_amount_band === 'high',
      reason_if_met: 'amount_above_auto_limit',
      details: `El importe afectado ($${affected_amount} UYU) supera el tope de $600 UYU.`,
    },
    {
      guard_id: 'SIM_GUARD_006',
      name: 'Baja confianza de clasificación (<0.60)',
      condition_met: !classifier_confidence_ok,
      reason_if_met: 'low_classifier_confidence',
      details: `Confianza de clasificación ${confidence.toFixed(2)} inferior al mínimo 0.60.`,
    },
  ];

  const triggeredGuard = guard_evaluations.find((g) => g.condition_met);

  if (triggeredGuard) {
    const decision: Decision = 'human_review';
    const reason = triggeredGuard.reason_if_met;
    return {
      case_id,
      order_id,
      claim_type,
      affected_items,
      evidence_received,
      evidence_status,
      evidence_observations,
      decision,
      proposed_resolution: buildProposedResolutionText(decision, null, triggeredGuard.guard_id, reason),
      proposed_amount: null,
      currency: 'UYU',
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: [triggeredGuard.guard_id],
      customer_message: buildCustomerMessage(decision, null, reason),
      confidence_note: `Activación de guarda de seguridad ${triggeredGuard.guard_id} (${triggeredGuard.name}). Derivación inmediata obligatoria.`,
      executed: false,
    };
  }

  // 6. Fase B: REGLAS DE RESOLUCIÓN (solo si ninguna guarda se cumplió)
  const has_pending_refund =
    input.order?.previous_resolution?.status === 'pending' ||
    input.order?.previous_resolution?.status === 'approved';

  interface MatchedCandidate {
    rule_id: string;
    decision: Decision;
    details: string;
  }

  const matchedRules: MatchedCandidate[] = [];

  if (claim_type === 'missing_item' && affected_amount_band === 'low') {
    matchedRules.push({
      rule_id: 'SIM_RULE_001',
      decision: 'proposed_refund',
      details: 'Faltante en banda baja: se propone devolución sin requerir foto.',
    });
  }
  if (claim_type === 'damaged_product' && evidence_status === 'supports_claim') {
    matchedRules.push({
      rule_id: 'SIM_RULE_002',
      decision: 'proposed_refund',
      details: 'Producto dañado con evidencia que respalda el reclamo.',
    });
  }
  if (claim_type === 'wrong_item' && evidence_status === 'supports_claim') {
    matchedRules.push({
      rule_id: 'SIM_RULE_003',
      decision: 'proposed_refund',
      details: 'Producto equivocado con evidencia visual que respalda el reclamo.',
    });
  }
  if (
    ['damaged_product', 'wrong_item'].includes(claim_type) &&
    ['not_provided', 'insufficient', 'unclear'].includes(evidence_status)
  ) {
    matchedRules.push({
      rule_id: 'SIM_RULE_004',
      decision: 'request_more_information',
      details: 'Se requiere fotografía legible del producto antes de emitir resolución.',
    });
  }
  if (claim_type === 'missing_item' && affected_amount_band === 'medium') {
    matchedRules.push({
      rule_id: 'SIM_RULE_005',
      decision: 'proposed_coupon',
      details: 'Faltante en banda media: se propone cupón en lugar de devolución.',
    });
  }
  if (claim_type === 'refund_delay' && has_pending_refund) {
    matchedRules.push({
      rule_id: 'SIM_RULE_006',
      decision: 'no_compensation',
      details: 'Consulta por acreditación de reembolso en curso.',
    });
  }

  if (matchedRules.length === 0) {
    const decision: Decision = 'human_review';
    const reason: HumanReviewReasonCode = 'no_matching_rule';
    return {
      case_id,
      order_id,
      claim_type,
      affected_items,
      evidence_received,
      evidence_status,
      evidence_observations,
      decision,
      proposed_resolution: buildProposedResolutionText(decision, null, null, reason),
      proposed_amount: null,
      currency: 'UYU',
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: [],
      customer_message: buildCustomerMessage(decision, null, reason),
      confidence_note: 'Ninguna regla simulada cubre las condiciones particulares de este caso.',
      executed: false,
    };
  }

  const distinctDecisions = new Set(matchedRules.map((r) => r.decision));
  if (distinctDecisions.size > 1) {
    const decision: Decision = 'human_review';
    const reason: HumanReviewReasonCode = 'conflicting_rules';
    return {
      case_id,
      order_id,
      claim_type,
      affected_items,
      evidence_received,
      evidence_status,
      evidence_observations,
      decision,
      proposed_resolution: buildProposedResolutionText(decision, null, null, reason),
      proposed_amount: null,
      currency: 'UYU',
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: matchedRules.map((r) => r.rule_id),
      customer_message: buildCustomerMessage(decision, null, reason),
      confidence_note: 'Se detectó conflicto entre reglas simuladas con decisiones divergentes.',
      executed: false,
    };
  }

  const selectedRule = matchedRules[0];
  const decision = selectedRule.decision;

  let proposed_amount: number | null = null;
  if (decision === 'proposed_refund' || decision === 'proposed_coupon') {
    if (affected_amount !== null) {
      proposed_amount = Math.min(affected_amount, 600);
    }
  }

  return {
    case_id,
    order_id,
    claim_type,
    affected_items,
    evidence_received,
    evidence_status,
    evidence_observations,
    decision,
    proposed_resolution: buildProposedResolutionText(decision, proposed_amount, selectedRule.rule_id, null),
    proposed_amount,
    currency: 'UYU',
    requires_human_review: false,
    human_review_reason: [],
    rules_applied: [selectedRule.rule_id],
    customer_message: buildCustomerMessage(decision, proposed_amount, null),
    confidence_note: `Lectura de alta confianza (${(confidence * 100).toFixed(0)}%). Aplicada regla ${selectedRule.rule_id}: ${selectedRule.details}`,
    executed: false,
  };
}
