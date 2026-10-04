// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

// src/lib/claimEngine.ts
function normalize(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
function classifyClaim(menuReason, customerText) {
  const normMenu = normalize(menuReason);
  const normText = normalize(customerText);
  let candidateType = "other";
  if (normMenu.includes("faltan") || normMenu.includes("falto") || normMenu.includes("incompleto") || normMenu.includes("falta")) {
    candidateType = "missing_item";
  } else if (normMenu.includes("dan") || normMenu.includes("rot") || normMenu.includes("derram") || normMenu.includes("aplast")) {
    candidateType = "damaged_product";
  } else if (normMenu.includes("equivoc") || normMenu.includes("distinto") || normMenu.includes("otro producto") || normMenu.includes("diferente")) {
    candidateType = "wrong_item";
  } else if (normMenu.includes("demora") && (normMenu.includes("pedido") || normMenu.includes("entrega"))) {
    candidateType = "delayed_order";
  } else if (normMenu.includes("devolucion") || normMenu.includes("reembolso") || normMenu.includes("acredit")) {
    candidateType = "refund_delay";
  } else if (normMenu.includes("otro") || normMenu.includes("consulta")) {
    candidateType = "other";
  } else {
    candidateType = "unclear";
  }
  const hasDamageWords = /\b(rot[oa]s?|danad[oa]s?|danos?|derram[a-z]*|aplastad[oa]s?|abiert[oa]s?|chorre[a-z]*|incomible|fisur[a-z]*|rajad[oa]s?|quebrad[oa]s?|reventad[oa]s?|se salio)\b/i.test(normText);
  const hasWrongWords = /\b(equivocad[oa]s?|no es lo que pedi|otra cosa|distinto|vino con|mandaron otr[oa]s?|diferente)\b/i.test(normText);
  const hasMissingWords = /\b(no vino|no llego|no me trajeron|falto|faltan|olvidaron|falta|incompleto)\b/i.test(normText);
  let confidence = 0.95;
  let notes = "El texto del cliente es consistente con el motivo seleccionado en el men\xFA.";
  if (candidateType === "missing_item" && hasDamageWords && !hasMissingWords) {
    confidence = 0.4;
    notes = "Inconsistencia detectada: men\xFA indica faltante pero el cliente describe da\xF1o o derrame.";
  } else if (candidateType === "damaged_product" && hasMissingWords && !hasDamageWords) {
    confidence = 0.45;
    notes = "Inconsistencia detectada: men\xFA indica da\xF1o pero el cliente describe que el producto no vino.";
  } else if (candidateType === "delayed_order" && (hasDamageWords || hasWrongWords)) {
    confidence = 0.5;
    notes = "Inconsistencia detectada: men\xFA indica demora pero el texto reclama calidad o contenido del producto.";
  } else if (normText.length < 5 && candidateType !== "other") {
    confidence = 0.55;
    notes = "Texto del cliente demasiado escueto para convalidar el motivo elegido.";
  }
  return { claim_type: candidateType, confidence, notes };
}
function matchClaimedProduct(claimedName, items) {
  if (!claimedName || !claimedName.trim()) {
    return { matches: [], error: "missing_required_field" };
  }
  const normClaimed = normalize(claimedName);
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
          amount: item.qty * item.unit_price
        }
      ],
      error: null
    };
  }
  const partial = items.filter(
    (item) => normalize(item.name).includes(normClaimed) || normClaimed.includes(normalize(item.name))
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
          amount: item.qty * item.unit_price
        }
      ],
      error: null
    };
  }
  if (partial.length > 1) {
    return { matches: [], error: "ambiguous_product_match" };
  }
  return { matches: [], error: "product_not_in_order" };
}
function evaluateEvidenceStatus(claimType, _customerText, visualEvidence) {
  const hasEvidence = Boolean(
    visualEvidence && (visualEvidence.image_url || visualEvidence.image_base64 || visualEvidence.description)
  );
  if (claimType === "missing_item" || claimType === "refund_delay") {
    return {
      status: "not_required",
      observations: hasEvidence && visualEvidence?.description ? [visualEvidence.description] : [],
      evidence_received: hasEvidence
    };
  }
  if (!hasEvidence) {
    return {
      status: "not_provided",
      observations: [],
      evidence_received: false
    };
  }
  const desc = normalize(visualEvidence?.description || "");
  const observationPhrases = [];
  if (desc.includes("borrosa") || desc.includes("oscura") || desc.includes("cortada") || desc.includes("ilegible")) {
    observationPhrases.push("La imagen presenta desenfoque y baja iluminaci\xF3n que impiden distinguir el estado del producto.");
    return {
      status: "insufficient",
      observations: observationPhrases,
      evidence_received: true
    };
  }
  if (desc.includes("no muestra el producto") || desc.includes("otro objeto") || desc.includes("mesa vacia") || desc.includes("superficie vacia") || desc.includes("solo se ve el fondo")) {
    observationPhrases.push("La toma fotogr\xE1fica muestra una superficie u objeto ajeno al art\xEDculo indicado en el reclamo.");
    return {
      status: "unclear",
      observations: observationPhrases,
      evidence_received: true
    };
  }
  if (desc.includes("intacto") || desc.includes("perfecto estado") || desc.includes("sin danos") || desc.includes("sellado") || desc.includes("coincide exactamente") || desc.includes("sin roturas")) {
    observationPhrases.push("Se aprecia el empaque original completamente cerrado y sin deformaciones visibles.");
    observationPhrases.push("No se evidencian p\xE9rdidas de contenido, fisuras ni roturas en el contenedor.");
    return {
      status: "contradicts_claim",
      observations: observationPhrases,
      evidence_received: true
    };
  }
  if (desc.includes("roto") || desc.includes("derramado") || desc.includes("abierto") || desc.includes("aplastado") || desc.includes("equivocado") || desc.includes("diferente") || desc.includes("dano") || desc.includes("fisura")) {
    observationPhrases.push(
      visualEvidence?.description || "Se observa el producto con tapa desprendida y derrame visible de contenido en la bolsa contenedora."
    );
    return {
      status: "supports_claim",
      observations: observationPhrases,
      evidence_received: true
    };
  }
  observationPhrases.push(visualEvidence?.description || "Evidencia no concluyente respecto al estado reportado.");
  return {
    status: "unclear",
    observations: observationPhrases,
    evidence_received: true
  };
}
function buildCustomerMessage(decision, amount, humanReason) {
  const disclaimer = "[PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]";
  switch (decision) {
    case "proposed_refund":
      return `Hola, lamentamos el inconveniente con tu pedido. De acuerdo a las condiciones del caso, te proponemos la devoluci\xF3n de $${amount} UYU por el producto afectado. ${disclaimer}`;
    case "proposed_coupon":
      return `Hola, te pedimos disculpas por la falta en tu entrega. Te proponemos un cup\xF3n de compensaci\xF3n por valor de $${amount} UYU para tu pr\xF3xima compra. ${disclaimer}`;
    case "request_more_information":
      return `Hola, para poder evaluar tu reclamo necesitamos que nos env\xEDes una foto clara y legible donde se aprecie el estado del producto afectado. Quedamos a la espera de la imagen. ${disclaimer}`;
    case "no_compensation":
      return `Hola, te informamos que tu solicitud de devoluci\xF3n previa ya fue registrada y el plazo de acreditaci\xF3n efectivo depende exclusivamente de tu entidad bancaria o medio de pago. No corresponde una nueva compensaci\xF3n. ${disclaimer}`;
    case "human_review":
    default: {
      let detalle = "un representante de nuestro equipo revisar\xE1 tu caso";
      if (humanReason === "outside_claim_window") {
        detalle = "el reclamo fue ingresado fuera de la ventana horaria prevista y pasar\xE1 a revisi\xF3n manual";
      } else if (humanReason === "amount_above_auto_limit") {
        detalle = "el importe involucrado excede el l\xEDmite de resoluci\xF3n autom\xE1tica y debe ser evaluado por un supervisor";
      } else if (humanReason === "customer_disputes_previous_resolution") {
        detalle = "al tratarse de una reapertura o disconformidad con una resoluci\xF3n anterior, un analista examinar\xE1 el caso";
      } else if (humanReason === "evidence_contradicts_description") {
        detalle = "se detectaron diferencias entre la informaci\xF3n provista y la evidencia adjunta, por lo que un agente intervendr\xE1 para validar el reclamo";
      } else if (humanReason === "product_not_in_order") {
        detalle = "el art\xEDculo reclamado no figura registrado en las l\xEDneas del pedido entregado y ser\xE1 revisado manualmente";
      }
      return `Hola, recibimos tu solicitud. Para brindarte una respuesta precisa, ${detalle}. Nos comunicaremos a la brevedad. ${disclaimer}`;
    }
  }
}
function buildProposedResolutionText(decision, amount, ruleOrGuard, reason) {
  switch (decision) {
    case "proposed_refund":
      return `Devoluci\xF3n propuesta por $${amount} UYU (${ruleOrGuard}).`;
    case "proposed_coupon":
      return `Cup\xF3n de compensaci\xF3n propuesto por $${amount} UYU (${ruleOrGuard}).`;
    case "request_more_information":
      return `Solicitud de fotograf\xEDa legible del producto afectado (${ruleOrGuard}).`;
    case "no_compensation":
      return `Sin compensaci\xF3n adicional por encontrarse tr\xE1mite de reembolso ya en curso (${ruleOrGuard}).`;
    case "human_review":
    default:
      return `Derivaci\xF3n a revisi\xF3n humana por motivo: ${reason || "criterio simulado"} (${ruleOrGuard || "SIM_GUARD"}).`;
  }
}
function evaluateSyntheticClaim(input) {
  const case_id = input.case_id || "SYN-CASE-001";
  const order_id = input.order_id || input.order?.order_id || "SYN-ORDER-001";
  const { claim_type, confidence, notes: classifier_notes } = classifyClaim(
    input.menu_reason,
    input.customer_description
  );
  const classifier_confidence_ok = confidence >= 0.6;
  let affected_items = [];
  let productMatchError = null;
  if (claim_type !== "refund_delay" && claim_type !== "delayed_order") {
    const matchResult = matchClaimedProduct(input.claimed_product_name, input.order?.items || []);
    if (matchResult.error) {
      productMatchError = matchResult.error;
    } else {
      affected_items = matchResult.matches;
    }
  }
  const {
    status: evidence_status,
    observations: evidence_observations,
    evidence_received
  } = evaluateEvidenceStatus(claim_type, input.customer_description, input.visual_evidence);
  const affected_sum = affected_items.reduce((acc, item) => acc + item.amount, 0);
  const affected_amount = affected_items.length > 0 ? affected_sum : null;
  let affected_amount_band = "low";
  if (affected_amount !== null) {
    if (affected_amount <= 400) {
      affected_amount_band = "low";
    } else if (affected_amount <= 600) {
      affected_amount_band = "medium";
    } else {
      affected_amount_band = "high";
    }
  }
  const claim_within_window = input.hours_since_delivery <= 48;
  if (productMatchError) {
    const decision2 = "human_review";
    const reason = productMatchError;
    return {
      case_id,
      order_id,
      claim_type,
      affected_items: [],
      evidence_received,
      evidence_status,
      evidence_observations,
      decision: decision2,
      proposed_resolution: buildProposedResolutionText(decision2, null, null, reason),
      proposed_amount: null,
      currency: "UYU",
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: [],
      customer_message: buildCustomerMessage(decision2, null, reason),
      confidence_note: `No fue posible encontrar el producto '${input.claimed_product_name}' entre los \xEDtems del pedido sint\xE9tico. Se deriva a revisi\xF3n humana.`,
      executed: false
    };
  }
  const guard_evaluations = [
    {
      guard_id: "SIM_GUARD_001",
      name: "Evidencia contradice descripci\xF3n",
      condition_met: evidence_status === "contradicts_claim",
      reason_if_met: "evidence_contradicts_description",
      details: "La evidencia visual contradice lo descripto por el cliente."
    },
    {
      guard_id: "SIM_GUARD_002",
      name: "Tipo de reclamo no cubierto",
      condition_met: ["other", "unclear", "delayed_order"].includes(claim_type),
      reason_if_met: "claim_type_not_covered",
      details: `El motivo '${claim_type}' no cuenta con pol\xEDtica autom\xE1tica definida.`
    },
    {
      guard_id: "SIM_GUARD_003",
      name: "Cliente cuestiona resoluci\xF3n previa",
      condition_met: input.customer_disputes_previous_resolution === true,
      reason_if_met: "customer_disputes_previous_resolution",
      details: "El cliente disputa la resoluci\xF3n previa."
    },
    {
      guard_id: "SIM_GUARD_004",
      name: "Fuera de ventana de reclamo (48h)",
      condition_met: !claim_within_window,
      reason_if_met: "outside_claim_window",
      details: `Reclamo abierto a las ${input.hours_since_delivery} horas (l\xEDmite: 48 horas).`
    },
    {
      guard_id: "SIM_GUARD_005",
      name: "Importe superior al tope autom\xE1tico",
      condition_met: affected_amount_band === "high",
      reason_if_met: "amount_above_auto_limit",
      details: `El importe afectado ($${affected_amount} UYU) supera el tope de $600 UYU.`
    },
    {
      guard_id: "SIM_GUARD_006",
      name: "Baja confianza de clasificaci\xF3n (<0.60)",
      condition_met: !classifier_confidence_ok,
      reason_if_met: "low_classifier_confidence",
      details: `Confianza de clasificaci\xF3n ${confidence.toFixed(2)} inferior al m\xEDnimo 0.60.`
    }
  ];
  const triggeredGuard = guard_evaluations.find((g) => g.condition_met);
  if (triggeredGuard) {
    const decision2 = "human_review";
    const reason = triggeredGuard.reason_if_met;
    return {
      case_id,
      order_id,
      claim_type,
      affected_items,
      evidence_received,
      evidence_status,
      evidence_observations,
      decision: decision2,
      proposed_resolution: buildProposedResolutionText(decision2, null, triggeredGuard.guard_id, reason),
      proposed_amount: null,
      currency: "UYU",
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: [triggeredGuard.guard_id],
      customer_message: buildCustomerMessage(decision2, null, reason),
      confidence_note: `Activaci\xF3n de guarda de seguridad ${triggeredGuard.guard_id} (${triggeredGuard.name}). Derivaci\xF3n inmediata obligatoria.`,
      executed: false
    };
  }
  const has_pending_refund = input.order?.previous_resolution?.status === "pending" || input.order?.previous_resolution?.status === "approved";
  const matchedRules = [];
  if (claim_type === "missing_item" && affected_amount_band === "low") {
    matchedRules.push({
      rule_id: "SIM_RULE_001",
      decision: "proposed_refund",
      details: "Faltante en banda baja: se propone devoluci\xF3n sin requerir foto."
    });
  }
  if (claim_type === "damaged_product" && evidence_status === "supports_claim") {
    matchedRules.push({
      rule_id: "SIM_RULE_002",
      decision: "proposed_refund",
      details: "Producto da\xF1ado con evidencia que respalda el reclamo."
    });
  }
  if (claim_type === "wrong_item" && evidence_status === "supports_claim") {
    matchedRules.push({
      rule_id: "SIM_RULE_003",
      decision: "proposed_refund",
      details: "Producto equivocado con evidencia visual que respalda el reclamo."
    });
  }
  if (["damaged_product", "wrong_item"].includes(claim_type) && ["not_provided", "insufficient", "unclear"].includes(evidence_status)) {
    matchedRules.push({
      rule_id: "SIM_RULE_004",
      decision: "request_more_information",
      details: "Se requiere fotograf\xEDa legible del producto antes de emitir resoluci\xF3n."
    });
  }
  if (claim_type === "missing_item" && affected_amount_band === "medium") {
    matchedRules.push({
      rule_id: "SIM_RULE_005",
      decision: "proposed_coupon",
      details: "Faltante en banda media: se propone cup\xF3n en lugar de devoluci\xF3n."
    });
  }
  if (claim_type === "refund_delay" && has_pending_refund) {
    matchedRules.push({
      rule_id: "SIM_RULE_006",
      decision: "no_compensation",
      details: "Consulta por acreditaci\xF3n de reembolso en curso."
    });
  }
  if (matchedRules.length === 0) {
    const decision2 = "human_review";
    const reason = "no_matching_rule";
    return {
      case_id,
      order_id,
      claim_type,
      affected_items,
      evidence_received,
      evidence_status,
      evidence_observations,
      decision: decision2,
      proposed_resolution: buildProposedResolutionText(decision2, null, null, reason),
      proposed_amount: null,
      currency: "UYU",
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: [],
      customer_message: buildCustomerMessage(decision2, null, reason),
      confidence_note: "Ninguna regla simulada cubre las condiciones particulares de este caso.",
      executed: false
    };
  }
  const distinctDecisions = new Set(matchedRules.map((r) => r.decision));
  if (distinctDecisions.size > 1) {
    const decision2 = "human_review";
    const reason = "conflicting_rules";
    return {
      case_id,
      order_id,
      claim_type,
      affected_items,
      evidence_received,
      evidence_status,
      evidence_observations,
      decision: decision2,
      proposed_resolution: buildProposedResolutionText(decision2, null, null, reason),
      proposed_amount: null,
      currency: "UYU",
      requires_human_review: true,
      human_review_reason: [reason],
      rules_applied: matchedRules.map((r) => r.rule_id),
      customer_message: buildCustomerMessage(decision2, null, reason),
      confidence_note: "Se detect\xF3 conflicto entre reglas simuladas con decisiones divergentes.",
      executed: false
    };
  }
  const selectedRule = matchedRules[0];
  const decision = selectedRule.decision;
  let proposed_amount = null;
  if (decision === "proposed_refund" || decision === "proposed_coupon") {
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
    currency: "UYU",
    requires_human_review: false,
    human_review_reason: [],
    rules_applied: [selectedRule.rule_id],
    customer_message: buildCustomerMessage(decision, proposed_amount, null),
    confidence_note: `Lectura de alta confianza (${(confidence * 100).toFixed(0)}%). Aplicada regla ${selectedRule.rule_id}: ${selectedRule.details}`,
    executed: false
  };
}

// src/data/benchmarkCases.ts
var BENCHMARK_CASES = [
  {
    id: "BENCH-01",
    title: "Faltante en banda baja (SIM_RULE_001)",
    category: "Reglas",
    expected_rule_or_guard: "SIM_RULE_001",
    expected_decision: "proposed_refund",
    description: "Producto faltante declarado que existe en el pedido y su costo est\xE1 en banda baja ($250 <= $400). Se propone reembolso sin requerir evidencia visual.",
    input: {
      case_id: "SYN-CASE-001",
      order_id: "SYN-ORDER-101",
      order: {
        order_id: "SYN-ORDER-101",
        items: [
          { product_id: "PRD-101", name: "Milanesa Napolitana con Fritas", qty: 1, unit_price: 490 },
          { product_id: "PRD-102", name: "Postre Chaj\xE1 Individual", qty: 1, unit_price: 250 }
        ],
        delivered_at_hours_ago: 3
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Postre Chaj\xE1 Individual",
      customer_description: "Abr\xED la bolsa y faltaba el postre Chaj\xE1 que ped\xED, solo vino la milanesa.",
      visual_evidence: null,
      hours_since_delivery: 3,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-02",
    title: "Faltante en banda media (SIM_RULE_005)",
    category: "Reglas",
    expected_rule_or_guard: "SIM_RULE_005",
    expected_decision: "proposed_coupon",
    description: "Faltante en banda media ($520, entre $401 y $600). Por regla simulada se compensa con cup\xF3n en lugar de reembolso.",
    input: {
      case_id: "SYN-CASE-002",
      order_id: "SYN-ORDER-102",
      order: {
        order_id: "SYN-ORDER-102",
        items: [
          { product_id: "PRD-201", name: "Pizza Cuatro Quesos Familiar", qty: 1, unit_price: 520 },
          { product_id: "PRD-202", name: "Refresco Cola 1.5L", qty: 1, unit_price: 160 }
        ],
        delivered_at_hours_ago: 6
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Pizza Cuatro Quesos Familiar",
      customer_description: "El repartidor solo me entreg\xF3 la botella de refresco, se olvid\xF3 de la pizza familiar.",
      visual_evidence: null,
      hours_since_delivery: 6,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-03",
    title: "Producto da\xF1ado con evidencia (SIM_RULE_002)",
    category: "Reglas",
    expected_rule_or_guard: "SIM_RULE_002",
    expected_decision: "proposed_refund",
    description: "Pote de helado derramado y roto en banda baja ($340). La evidencia visual respalda el reclamo.",
    input: {
      case_id: "SYN-CASE-003",
      order_id: "SYN-ORDER-103",
      order: {
        order_id: "SYN-ORDER-103",
        items: [
          { product_id: "PRD-301", name: "Pote Helado Artesanal 1kg", qty: 1, unit_price: 340 }
        ],
        delivered_at_hours_ago: 1
      },
      menu_reason: "Producto roto o da\xF1ado",
      claimed_product_name: "Pote Helado Artesanal 1kg",
      customer_description: "El helado lleg\xF3 totalmente aplastado y con la tapa reventada, se chorre\xF3 todo en la bolsa.",
      visual_evidence: {
        description: "Se observa un envase t\xE9rmico de telgopor con tapa fisurada y helado derramado en el fondo de la bolsa pl\xE1stica."
      },
      hours_since_delivery: 1,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-04",
    title: "Producto equivocado con evidencia (SIM_RULE_003)",
    category: "Reglas",
    expected_rule_or_guard: "SIM_RULE_003",
    expected_decision: "proposed_refund",
    description: "Se pidi\xF3 ensalada C\xE9sar pero se entreg\xF3 ensalada de frutas. La evidencia visual respalda el error.",
    input: {
      case_id: "SYN-CASE-004",
      order_id: "SYN-ORDER-104",
      order: {
        order_id: "SYN-ORDER-104",
        items: [
          { product_id: "PRD-401", name: "Ensalada C\xE9sar con Pollo", qty: 1, unit_price: 320 },
          { product_id: "PRD-402", name: "Agua Mineral sin Gas", qty: 1, unit_price: 90 }
        ],
        delivered_at_hours_ago: 2
      },
      menu_reason: "Producto equivocado",
      claimed_product_name: "Ensalada C\xE9sar con Pollo",
      customer_description: "Ped\xED ensalada C\xE9sar y me mandaron un pote con ensalada de frutas con kiwi y manzana.",
      visual_evidence: {
        description: "Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja) con etiqueta diferente."
      },
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-05",
    title: "Da\xF1ado sin foto adjunta (SIM_RULE_004)",
    category: "Reglas",
    expected_rule_or_guard: "SIM_RULE_004",
    expected_decision: "request_more_information",
    description: "El cliente reporta producto roto pero no adjunt\xF3 evidencia visual. Se solicita foto n\xEDtida en lugar de rechazar.",
    input: {
      case_id: "SYN-CASE-005",
      order_id: "SYN-ORDER-105",
      order: {
        order_id: "SYN-ORDER-105",
        items: [
          { product_id: "PRD-501", name: "Botella de Vino Tannat Reserva", qty: 1, unit_price: 390 }
        ],
        delivered_at_hours_ago: 5
      },
      menu_reason: "Producto da\xF1ado",
      claimed_product_name: "Botella de Vino Tannat Reserva",
      customer_description: "La botella de vino lleg\xF3 rajada y el l\xEDquido se sali\xF3.",
      visual_evidence: null,
      hours_since_delivery: 5,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-06",
    title: "Evidencia contradice reclamo (SIM_GUARD_001)",
    category: "Guardas",
    expected_rule_or_guard: "SIM_GUARD_001",
    expected_decision: "human_review",
    expected_review_reason: "evidence_contradicts_description",
    description: "El cliente dice que la pizza vino destruida pero la foto adjunta muestra la pizza en perfecto estado y sellada.",
    input: {
      case_id: "SYN-CASE-006",
      order_id: "SYN-ORDER-106",
      order: {
        order_id: "SYN-ORDER-106",
        items: [
          { product_id: "PRD-601", name: "Pizza Muzzarella al Tacho", qty: 1, unit_price: 380 }
        ],
        delivered_at_hours_ago: 2
      },
      menu_reason: "Producto roto o da\xF1ado",
      claimed_product_name: "Pizza Muzzarella al Tacho",
      customer_description: "La pizza vino completamente destrozada e incomible, toda pegada a la tapa.",
      visual_evidence: {
        description: "Se observa una caja de pizza abierta con la pizza intacta, muzzarella uniforme y sin roturas ni deformaciones."
      },
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-07",
    title: "Motivo no cubierto: Demora (SIM_GUARD_002)",
    category: "Guardas",
    expected_rule_or_guard: "SIM_GUARD_002",
    expected_decision: "human_review",
    expected_review_reason: "claim_type_not_covered",
    description: "El cliente reclama por pedido demorado. Al ser un supuesto acad\xE9mico no relevado, la guarda SIM_GUARD_002 deriva a un humano sin inventar reglas.",
    input: {
      case_id: "SYN-CASE-007",
      order_id: "SYN-ORDER-107",
      order: {
        order_id: "SYN-ORDER-107",
        items: [
          { product_id: "PRD-701", name: "Combo Hamburguesa Doble Cheddar", qty: 1, unit_price: 450 }
        ],
        delivered_at_hours_ago: 1
      },
      menu_reason: "Demora en la entrega",
      claimed_product_name: "Combo Hamburguesa Doble Cheddar",
      customer_description: "El pedido tard\xF3 m\xE1s de una hora y media en llegar cuando la app dec\xEDa 30 minutos.",
      visual_evidence: null,
      hours_since_delivery: 1,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-08",
    title: "Cliente cuestiona resoluci\xF3n anterior (SIM_GUARD_003)",
    category: "Guardas",
    expected_rule_or_guard: "SIM_GUARD_003",
    expected_decision: "human_review",
    expected_review_reason: "customer_disputes_previous_resolution",
    description: "El cliente no est\xE1 conforme con un cup\xF3n recibido previamente y cuestiona la decisi\xF3n. Deriva inmediatamente a un analista humano.",
    input: {
      case_id: "SYN-CASE-008",
      order_id: "SYN-ORDER-108",
      order: {
        order_id: "SYN-ORDER-108",
        items: [
          { product_id: "PRD-801", name: "Chivito Uruguayo al Plato", qty: 1, unit_price: 480 }
        ],
        previous_resolution: {
          status: "approved",
          type: "coupon",
          amount: 480,
          details: "Cup\xF3n otorgado por faltante previo"
        },
        delivered_at_hours_ago: 18
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Chivito Uruguayo al Plato",
      customer_description: "No acepto el cup\xF3n que me dieron antes, yo pagu\xE9 con tarjeta de d\xE9bito y exijo la plata de vuelta.",
      visual_evidence: null,
      hours_since_delivery: 18,
      customer_disputes_previous_resolution: true
    }
  },
  {
    id: "BENCH-09",
    title: "Fuera de ventana de 48h (SIM_GUARD_004)",
    category: "Guardas",
    expected_rule_or_guard: "SIM_GUARD_004",
    expected_decision: "human_review",
    expected_review_reason: "outside_claim_window",
    description: "El reclamo se inici\xF3 52 horas despu\xE9s de la entrega, superando la ventana simulada de 48 horas.",
    input: {
      case_id: "SYN-CASE-009",
      order_id: "SYN-ORDER-109",
      order: {
        order_id: "SYN-ORDER-109",
        items: [
          { product_id: "PRD-901", name: "Empanadas Criollas x4", qty: 1, unit_price: 360 }
        ],
        delivered_at_hours_ago: 52
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Empanadas Criollas x4",
      customer_description: "El s\xE1bado ped\xED empanadas y me di cuenta que no vinieron las de carne picante.",
      visual_evidence: null,
      hours_since_delivery: 52,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-10",
    title: "Importe superior al tope autom\xE1tico (SIM_GUARD_005)",
    category: "Guardas",
    expected_rule_or_guard: "SIM_GUARD_005",
    expected_decision: "human_review",
    expected_review_reason: "amount_above_auto_limit",
    description: "El producto afectado cuesta $850 UYU, superando el tope de resoluci\xF3n autom\xE1tica de $600 UYU (banda high).",
    input: {
      case_id: "SYN-CASE-010",
      order_id: "SYN-ORDER-110",
      order: {
        order_id: "SYN-ORDER-110",
        items: [
          { product_id: "PRD-1001", name: "Tabla Asado Premium Familiar", qty: 1, unit_price: 850 }
        ],
        delivered_at_hours_ago: 4
      },
      menu_reason: "Producto da\xF1ado",
      claimed_product_name: "Tabla Asado Premium Familiar",
      customer_description: "La tabla de asado vino derramada por completo en la bolsa y la carne fr\xEDa y tirada.",
      visual_evidence: {
        description: "Se observa una bandeja met\xE1lica destapada con cortes de carne esparcidos y jugo graso derramado."
      },
      hours_since_delivery: 4,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-11",
    title: "Baja confianza de clasificaci\xF3n (SIM_GUARD_006)",
    category: "Guardas",
    expected_rule_or_guard: "SIM_GUARD_006",
    expected_decision: "human_review",
    expected_review_reason: "low_classifier_confidence",
    description: 'El cliente eligi\xF3 "Producto faltante" en el men\xFA, pero en el texto escribe que el producto lleg\xF3 roto y aplastado. La inconsistencia reduce la confianza < 0.60 y deriva.',
    input: {
      case_id: "SYN-CASE-011",
      order_id: "SYN-ORDER-111",
      order: {
        order_id: "SYN-ORDER-111",
        items: [
          { product_id: "PRD-1101", name: "Tarta de Verdura y Queso", qty: 1, unit_price: 290 }
        ],
        delivered_at_hours_ago: 3
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Tarta de Verdura y Queso",
      customer_description: "La tarta lleg\xF3 aplastada, reventada y con la masa toda rota.",
      visual_evidence: null,
      hours_since_delivery: 3,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-12",
    title: "Producto no figura en el pedido (Caso Borde)",
    category: "Casos Borde",
    expected_rule_or_guard: "product_not_in_order",
    expected_decision: "human_review",
    expected_review_reason: "product_not_in_order",
    description: 'El cliente reclama un "Sushi Roll Salm\xF3n 15u" que no figura entre los productos del pedido sint\xE9tico recibido.',
    input: {
      case_id: "SYN-CASE-012",
      order_id: "SYN-ORDER-112",
      order: {
        order_id: "SYN-ORDER-112",
        items: [
          { product_id: "PRD-1201", name: "Sandwich Caliente Especial", qty: 2, unit_price: 180 },
          { product_id: "PRD-1202", name: "Limonada con Menta 500ml", qty: 1, unit_price: 120 }
        ],
        delivered_at_hours_ago: 2
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Sushi Roll Salm\xF3n 15u",
      customer_description: "Me falt\xF3 la bandeja de sushi que ped\xED con el sandwich caliente.",
      visual_evidence: null,
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false
    }
  },
  {
    id: "BENCH-13",
    title: "Consulta por demora en devoluci\xF3n (SIM_RULE_006)",
    category: "Reglas",
    expected_rule_or_guard: "SIM_RULE_006",
    expected_decision: "no_compensation",
    description: "El cliente consulta por un reembolso ya aprobado que a\xFAn no vio en su extracto bancario. Se informa que depende del medio de pago, sin nueva compensaci\xF3n.",
    input: {
      case_id: "SYN-CASE-013",
      order_id: "SYN-ORDER-113",
      order: {
        order_id: "SYN-ORDER-113",
        items: [
          { product_id: "PRD-1301", name: "Wok de Vegetales y Arroz", qty: 1, unit_price: 360 }
        ],
        previous_resolution: {
          status: "approved",
          type: "refund",
          amount: 360,
          details: "Devoluci\xF3n aprobada por tesorer\xEDa"
        },
        delivered_at_hours_ago: 24
      },
      menu_reason: "Demora en la devoluci\xF3n",
      claimed_product_name: "Wok de Vegetales y Arroz",
      customer_description: "Todav\xEDa no me aparece acreditada la plata de la devoluci\xF3n en el banco, \xBFcu\xE1nto demora?",
      visual_evidence: null,
      hours_since_delivery: 24,
      customer_disputes_previous_resolution: false
    }
  }
];

// src/data/demoCasesData.ts
var DEFAULT_DEMO_CASES = [
  // ==========================================
  // CASO A - Especificación del Requerimiento
  // ==========================================
  {
    id: "CASO-A",
    case_number: "A",
    name: "Caso A: Helado derramado con envase roto en transporte",
    description: "Reclamo post-entrega por helado artesanal con envase da\xF1ado y derramado dentro de la bolsa. Aplica la regla SIM_RULE_002 con evidencia fotogr\xE1fica suficiente en banda media.",
    customer: {
      customer_id: "CUST-7821",
      name: "Santiago P\xE9rez",
      phone: "+598 99 123 456",
      email: "santiago.perez@ejemplo.uy",
      delivery_address: "Bv. Espa\xF1a 2450, Apto 402, Pocitos, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-005",
      delivered: true,
      delivered_at_hours_ago: 1,
      order_timestamp: "2026-10-03T10:30:00Z",
      items: [
        {
          product_id: "SYN-P-500",
          name: "Helado 1 litro dulce de leche",
          qty: 1,
          unit_price: 540,
          total_price: 540
        },
        {
          product_id: "SYN-P-501",
          name: "Conos de galleta",
          qty: 1,
          unit_price: 200,
          total_price: 200
        }
      ],
      total_amount: 740,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-089",
      name: "Helader\xEDa Artesanal Los Alpes",
      category: "Helader\xEDas & Postres",
      zone: "Pocitos"
    },
    claimed_product: {
      product_id: "SYN-P-500",
      name: "Helado 1 litro dulce de leche",
      qty: 1,
      unit_price: 540,
      affected_amount: 540
    },
    total_order_amount: 740,
    total_affected_amount: 540,
    claim_reason_menu: "producto danado",
    customer_claim_description: "El helado de 1 litro llego con el pote roto y derretido, se derramo dentro de la bolsa.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: "photo",
      photo_description: "Se observa un pote de helado con la tapa desprendida y el envase deformado. Hay contenido derramado dentro de una bolsa de delivery. El contenido visible tiene consistencia liquida.",
      is_sufficient: true,
      evaluation_status: "supports_claim",
      observations: [
        "Se observa un pote de helado con la tapa desprendida y el envase deformado.",
        "Hay contenido derramado dentro de una bolsa de delivery.",
        "El contenido visible tiene consistencia liquida."
      ]
    },
    claim_status: "resuelto",
    current_step: {
      step_number: 4,
      step_name: "Resoluci\xF3n y Notificaci\xF3n",
      status: "completed",
      details: "Regla SIM_RULE_002 satisfecha. Propuesta de reembolso formulada al cliente."
    },
    analysis_result: {
      detected_claim_type: "damaged_product",
      confidence: 0.95,
      amount_band: "medium",
      matched_guards: [],
      matched_rules: ["SIM_RULE_002"]
    },
    expected_resolution: {
      decision: "proposed_refund",
      resolution_label: "Devoluci\xF3n propuesta por $540 UYU (SIM_RULE_002)",
      proposed_amount: 540,
      currency: "UYU",
      rationale: "Regla SIM_RULE_002: Da\xF1o f\xEDsico respaldado por evidencia fotogr\xE1fica sin activar ninguna guarda. El monto ($540 UYU) no excede el l\xEDmite de resoluci\xF3n autom\xE1tica ($600 UYU)."
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: "none",
      analyst_note: "No se requiere intervenci\xF3n humana. Resoluci\xF3n autom\xE1tica dentro de par\xE1metros."
    },
    refund_options: {
      available_methods: ["original_payment_method", "wallet_credits"],
      customer_choice: "original_payment_method",
      choice_description: "Reembolso directo al medio de pago original (Tarjeta de D\xE9bito)"
    },
    refund_status: "propuesta_simulada",
    customer_message: "Hola, lamentamos el inconveniente con tu pedido. De acuerdo a la evidencia adjunta, registramos el da\xF1o en el helado y te proponemos la devoluci\xF3n de $540 UYU. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Documento Sint\xE9tico Post-Entrega - Caso A (SYN-CASE-003 / SYN-ORDER-005)",
    claim_input_payload: {
      case_id: "SYN-CASE-003",
      order_id: "SYN-ORDER-005",
      order: {
        order_id: "SYN-ORDER-005",
        items: [
          { product_id: "SYN-P-500", name: "Helado 1 litro dulce de leche", qty: 1, unit_price: 540 },
          { product_id: "SYN-P-501", name: "Conos de galleta", qty: 1, unit_price: 200 }
        ],
        delivered_at_hours_ago: 1
      },
      menu_reason: "producto danado",
      claimed_product_name: "Helado 1 litro dulce de leche",
      customer_description: "El helado de 1 litro llego con el pote roto y derretido, se derramo dentro de la bolsa.",
      visual_evidence: {
        description: "Se observa un pote de helado con la tapa desprendida y el envase deformado. Hay contenido derramado dentro de una bolsa de delivery. El contenido visible tiene consistencia liquida."
      },
      hours_since_delivery: 1,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO B - Especificación del Requerimiento
  // ==========================================
  {
    id: "CASO-B",
    case_number: "B",
    name: "Caso B: Evidencia contradice da\xF1o declarado en milanesa al pan",
    description: "El cliente afirma que el s\xE1ndwich lleg\xF3 aplastado y con pan roto, pero la fotograf\xEDa demuestra el envoltorio y el alimento en \xF3ptimo estado sin alteraciones f\xEDsicas.",
    customer: {
      customer_id: "CUST-3912",
      name: "Mariana Silva",
      phone: "+598 98 456 789",
      email: "mariana.silva@ejemplo.uy",
      delivery_address: "18 de Julio 1320, Apto 901, Centro, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-004",
      delivered: true,
      delivered_at_hours_ago: 2,
      order_timestamp: "2026-10-03T09:15:00Z",
      items: [
        {
          product_id: "SYN-P-400",
          name: "Milanesa al pan",
          qty: 1,
          unit_price: 320,
          total_price: 320
        },
        {
          product_id: "SYN-P-401",
          name: "Agua sin gas 600ml",
          qty: 1,
          unit_price: 90,
          total_price: 90
        }
      ],
      total_amount: 410,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-042",
      name: "Bar & Rotiser\xEDa Central",
      category: "Minutas & S\xE1ndwiches",
      zone: "Centro"
    },
    claimed_product: {
      product_id: "SYN-P-400",
      name: "Milanesa al pan",
      qty: 1,
      unit_price: 320,
      affected_amount: 320
    },
    total_order_amount: 410,
    total_affected_amount: 320,
    claim_reason_menu: "producto danado",
    customer_claim_description: "La milanesa al pan llego aplastada y el pan roto, vino toda danada.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: "photo",
      photo_description: "Se observa un sandwich de milanesa entero, con el pan cerrado y sin deformaciones. El envoltorio se ve intacto y sin manchas. No se observan roturas ni contenido derramado.",
      is_sufficient: false,
      evaluation_status: "contradicts_claim",
      observations: [
        "Se observa un sandwich de milanesa entero, con el pan cerrado y sin deformaciones.",
        "El envoltorio se ve intacto y sin manchas.",
        "No se observan roturas ni contenido derramado."
      ]
    },
    claim_status: "derivado_humano",
    current_step: {
      step_number: 2,
      step_name: "Validaci\xF3n de Guardas",
      status: "blocked",
      details: "Guarda SIM_GUARD_001 activada: la evidencia visual contradice el texto del reclamo."
    },
    analysis_result: {
      detected_claim_type: "damaged_product",
      confidence: 0.95,
      amount_band: "low",
      matched_guards: ["SIM_GUARD_001"],
      matched_rules: []
    },
    expected_resolution: {
      decision: "human_review",
      resolution_label: "Derivaci\xF3n a revisi\xF3n humana por contradicci\xF3n de evidencia (SIM_GUARD_001)",
      proposed_amount: null,
      currency: "UYU",
      rationale: "Guarda SIM_GUARD_001: La evidencia contradice manifiestamente el reporte de producto destruido. El agente autom\xE1tico no debe conceder reembolsos indebidos."
    },
    human_intervention: {
      required: true,
      reasons: ["evidence_contradicts_description"],
      escalation_priority: "high",
      analyst_note: "Auditor\xEDa visual requerida: la imagen muestra producto \xEDntegro. Contrastar con lote del comercio y reporte del repartidor."
    },
    refund_options: {
      available_methods: ["none"],
      customer_choice: "pending",
      choice_description: "Suspendido a la espera del dictamen de la mesa de ayuda humana."
    },
    refund_status: "derivada_a_agente",
    customer_message: "Hola, recibimos tu solicitud. Para brindarte una respuesta precisa, se detectaron diferencias entre la informaci\xF3n provista y la evidencia adjunta, por lo que un agente de nuestro equipo revisar\xE1 tu caso. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Documento Sint\xE9tico Post-Entrega - Caso B (SYN-CASE-006 / SYN-ORDER-004)",
    claim_input_payload: {
      case_id: "SYN-CASE-006",
      order_id: "SYN-ORDER-004",
      order: {
        order_id: "SYN-ORDER-004",
        items: [
          { product_id: "SYN-P-400", name: "Milanesa al pan", qty: 1, unit_price: 320 },
          { product_id: "SYN-P-401", name: "Agua sin gas 600ml", qty: 1, unit_price: 90 }
        ],
        delivered_at_hours_ago: 2
      },
      menu_reason: "producto danado",
      claimed_product_name: "Milanesa al pan",
      customer_description: "La milanesa al pan llego aplastada y el pan roto, vino toda danada.",
      visual_evidence: {
        description: "Se observa un sandwich de milanesa entero, con el pan cerrado y sin deformaciones. El envoltorio se ve intacto y sin manchas. No se observan roturas ni contenido derramado."
      },
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO C / 8 - Especificación del Requerimiento
  // ==========================================
  {
    id: "CASO-C",
    case_number: "C",
    name: "Caso C / 8: \xCDtem no figura en el pedido entregado (Flan casero)",
    description: "El cliente reclama la ausencia de una porci\xF3n de flan casero, pero dicho producto nunca form\xF3 parte de la orden confirmada SYN-ORDER-004.",
    customer: {
      customer_id: "CUST-5129",
      name: "Gonzalo M\xE9ndez",
      phone: "+598 94 999 111",
      email: "gonzalo.mendez@ejemplo.uy",
      delivery_address: "Av. Brasil 2980, Pocitos, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-004",
      delivered: true,
      delivered_at_hours_ago: 1,
      order_timestamp: "2026-10-03T10:15:00Z",
      items: [
        {
          product_id: "SYN-P-400",
          name: "Milanesa al pan",
          qty: 1,
          unit_price: 320,
          total_price: 320
        },
        {
          product_id: "SYN-P-401",
          name: "Agua sin gas 600ml",
          qty: 1,
          unit_price: 90,
          total_price: 90
        }
      ],
      total_amount: 410,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-042",
      name: "Bar & Rotiser\xEDa Central",
      category: "Minutas & S\xE1ndwiches",
      zone: "Centro"
    },
    claimed_product: {
      product_id: "NON-EXISTENT",
      name: "Porci\xF3n de flan casero",
      qty: 1,
      unit_price: 0,
      affected_amount: 0
    },
    total_order_amount: 410,
    total_affected_amount: 0,
    claim_reason_menu: "pedido incompleto",
    customer_claim_description: "Falta el flan casero que habia pedido, no vino en la entrega.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: "none",
      is_sufficient: false,
      evaluation_status: "not_required",
      observations: []
    },
    claim_status: "derivado_humano",
    current_step: {
      step_number: 1,
      step_name: "Recepci\xF3n y Clasificaci\xF3n",
      status: "blocked",
      details: "El producto reclamado no figura en el pedido entregado (product_not_in_order)."
    },
    analysis_result: {
      detected_claim_type: "missing_item",
      confidence: 0.95,
      amount_band: "low",
      matched_guards: [],
      matched_rules: []
    },
    expected_resolution: {
      decision: "human_review",
      resolution_label: "Derivaci\xF3n a revisi\xF3n humana: producto no existe en el pedido",
      proposed_amount: null,
      currency: "UYU",
      rationale: "Criterio de consistencia de orden: el producto solicitado no coincide con los \xEDtems facturados en SYN-ORDER-004. Requiere validaci\xF3n de carrito y cuenta con soporte humano."
    },
    human_intervention: {
      required: true,
      reasons: ["product_not_in_order"],
      escalation_priority: "medium",
      analyst_note: "El cliente podr\xEDa haber dejado el \xEDtem en el carrito sin confirmar o estar refiri\xE9ndose a una orden distinta."
    },
    refund_options: {
      available_methods: ["none"],
      customer_choice: "none",
      choice_description: "No corresponde devoluci\xF3n econ\xF3mica por productos no facturados."
    },
    refund_status: "no_aplica",
    customer_message: "Hola, recibimos tu solicitud. Para brindarte una respuesta precisa, el art\xEDculo reclamado no figura registrado en las l\xEDneas del pedido entregado y ser\xE1 revisado manualmente por un representante de nuestro equipo. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Documento Sint\xE9tico Post-Entrega - Caso C / 8 (SYN-CASE-008 / SYN-ORDER-004)",
    claim_input_payload: {
      case_id: "SYN-CASE-008",
      order_id: "SYN-ORDER-004",
      order: {
        order_id: "SYN-ORDER-004",
        items: [
          { product_id: "SYN-P-400", name: "Milanesa al pan", qty: 1, unit_price: 320 },
          { product_id: "SYN-P-401", name: "Agua sin gas 600ml", qty: 1, unit_price: 90 }
        ],
        delivered_at_hours_ago: 1
      },
      menu_reason: "pedido incompleto",
      claimed_product_name: "porcion de flan casero",
      customer_description: "Falta el flan casero que habia pedido, no vino en la entrega.",
      visual_evidence: null,
      hours_since_delivery: 1,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO 2 - Especificación del Requerimiento
  // ==========================================
  {
    id: "CASO-2",
    case_number: "2",
    name: "Caso 2: Pizza Cuatro Quesos faltante en banda media (Cup\xF3n SIM_RULE_005)",
    description: "Faltante declarado de producto en banda media ($520 UYU, entre $401 y $600 UYU). Aplica compensaci\xF3n por cup\xF3n de compras sin exigir evidencia fotogr\xE1fica.",
    customer: {
      customer_id: "CUST-8832",
      name: "Luc\xEDa Rossi",
      phone: "+598 91 888 777",
      email: "lucia.rossi@ejemplo.uy",
      delivery_address: "Bvar. Artigas 1820, Parque Rod\xF3, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-102",
      delivered: true,
      delivered_at_hours_ago: 6,
      order_timestamp: "2026-10-03T05:00:00Z",
      items: [
        {
          product_id: "PRD-201",
          name: "Pizza Cuatro Quesos Familiar",
          qty: 1,
          unit_price: 520,
          total_price: 520
        },
        {
          product_id: "PRD-202",
          name: "Refresco Cola 1.5L",
          qty: 1,
          unit_price: 160,
          total_price: 160
        }
      ],
      total_amount: 680,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-015",
      name: "Pizzer\xEDa La Cl\xE1sica",
      category: "Pizzer\xEDas & Pastas",
      zone: "Parque Rod\xF3"
    },
    claimed_product: {
      product_id: "PRD-201",
      name: "Pizza Cuatro Quesos Familiar",
      qty: 1,
      unit_price: 520,
      affected_amount: 520
    },
    total_order_amount: 680,
    total_affected_amount: 520,
    claim_reason_menu: "Producto faltante",
    customer_claim_description: "El repartidor solo me entreg\xF3 la botella de refresco, se olvid\xF3 de la pizza familiar.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: "none",
      is_sufficient: true,
      evaluation_status: "not_required",
      observations: []
    },
    claim_status: "resuelto",
    current_step: {
      step_number: 4,
      step_name: "Resoluci\xF3n y Notificaci\xF3n",
      status: "completed",
      details: "Regla SIM_RULE_005 aplicada. Cup\xF3n de fidelizaci\xF3n emitido."
    },
    analysis_result: {
      detected_claim_type: "missing_item",
      confidence: 0.95,
      amount_band: "medium",
      matched_guards: [],
      matched_rules: ["SIM_RULE_005"]
    },
    expected_resolution: {
      decision: "proposed_coupon",
      resolution_label: "Cup\xF3n de compensaci\xF3n propuesto por $520 UYU (SIM_RULE_005)",
      proposed_amount: 520,
      currency: "UYU",
      rationale: "Regla SIM_RULE_005: En faltantes de banda media ($401 a $600 UYU) sin disputa previa, el sistema ofrece retenci\xF3n mediante cup\xF3n de cr\xE9dito instant\xE1neo."
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: "none",
      analyst_note: "Resoluci\xF3n autom\xE1tica completa. Fidelizaci\xF3n cliente en banda media."
    },
    refund_options: {
      available_methods: ["wallet_credits"],
      customer_choice: "wallet_credits",
      choice_description: "Cup\xF3n de cr\xE9dito de $520 UYU para la pr\xF3xima compra en la plataforma"
    },
    refund_status: "propuesta_simulada",
    customer_message: "Hola, te pedimos disculpas por la falta en tu entrega. Te proponemos un cup\xF3n de compensaci\xF3n por valor de $520 UYU para tu pr\xF3xima compra. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Benchmark Oficial ORT - Caso 2 (SYN-CASE-002 / BENCH-02)",
    claim_input_payload: {
      case_id: "SYN-CASE-002",
      order_id: "SYN-ORDER-102",
      order: {
        order_id: "SYN-ORDER-102",
        items: [
          { product_id: "PRD-201", name: "Pizza Cuatro Quesos Familiar", qty: 1, unit_price: 520 },
          { product_id: "PRD-202", name: "Refresco Cola 1.5L", qty: 1, unit_price: 160 }
        ],
        delivered_at_hours_ago: 6
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Pizza Cuatro Quesos Familiar",
      customer_description: "El repartidor solo me entreg\xF3 la botella de refresco, se olvid\xF3 de la pizza familiar.",
      visual_evidence: null,
      hours_since_delivery: 6,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO 1 - Faltante en Banda Baja
  // ==========================================
  {
    id: "CASO-1",
    case_number: "1",
    name: "Caso 1: Postre Chaj\xE1 faltante en banda baja (Reembolso SIM_RULE_001)",
    description: "Producto faltante con valor en banda baja ($250 UYU <= $400 UYU). Reembolso inmediato sin requerir fotograf\xEDa.",
    customer: {
      customer_id: "CUST-1044",
      name: "Federico Alvez",
      phone: "+598 99 333 222",
      email: "federico.alvez@ejemplo.uy",
      delivery_address: "Av. Rivera 3100, Buceo, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-101",
      delivered: true,
      delivered_at_hours_ago: 3,
      order_timestamp: "2026-10-03T08:00:00Z",
      items: [
        { product_id: "PRD-101", name: "Milanesa Napolitana con Fritas", qty: 1, unit_price: 490, total_price: 490 },
        { product_id: "PRD-102", name: "Postre Chaj\xE1 Individual", qty: 1, unit_price: 250, total_price: 250 }
      ],
      total_amount: 740,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-002",
      name: "Bodeg\xF3n Tradicional El Faro",
      category: "Restaurantes",
      zone: "Buceo"
    },
    claimed_product: {
      product_id: "PRD-102",
      name: "Postre Chaj\xE1 Individual",
      qty: 1,
      unit_price: 250,
      affected_amount: 250
    },
    total_order_amount: 740,
    total_affected_amount: 250,
    claim_reason_menu: "Producto faltante",
    customer_claim_description: "Abr\xED la bolsa y faltaba el postre Chaj\xE1 que ped\xED, solo vino la milanesa.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: "none",
      is_sufficient: true,
      evaluation_status: "not_required",
      observations: []
    },
    claim_status: "resuelto",
    current_step: {
      step_number: 4,
      step_name: "Resoluci\xF3n y Notificaci\xF3n",
      status: "completed",
      details: "Regla SIM_RULE_001 cumplida. Reembolso directo formulado."
    },
    analysis_result: {
      detected_claim_type: "missing_item",
      confidence: 0.95,
      amount_band: "low",
      matched_guards: [],
      matched_rules: ["SIM_RULE_001"]
    },
    expected_resolution: {
      decision: "proposed_refund",
      resolution_label: "Devoluci\xF3n propuesta por $250 UYU (SIM_RULE_001)",
      proposed_amount: 250,
      currency: "UYU",
      rationale: "Regla SIM_RULE_001: Faltante en banda baja ($250 <= $400 UYU) sin fricci\xF3n probatoria."
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: "none"
    },
    refund_options: {
      available_methods: ["original_payment_method", "wallet_credits"],
      customer_choice: "original_payment_method",
      choice_description: "Reembolso a la tarjeta de d\xE9bito emisora"
    },
    refund_status: "propuesta_simulada",
    customer_message: "Hola, lamentamos el inconveniente con tu pedido. Registramos la falta de Postre Chaj\xE1 Individual y te proponemos la devoluci\xF3n de $250 UYU. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Benchmark Oficial ORT - Caso 1 (SYN-CASE-001 / BENCH-01)",
    claim_input_payload: {
      case_id: "SYN-CASE-001",
      order_id: "SYN-ORDER-101",
      order: {
        order_id: "SYN-ORDER-101",
        items: [
          { product_id: "PRD-101", name: "Milanesa Napolitana con Fritas", qty: 1, unit_price: 490 },
          { product_id: "PRD-102", name: "Postre Chaj\xE1 Individual", qty: 1, unit_price: 250 }
        ],
        delivered_at_hours_ago: 3
      },
      menu_reason: "Producto faltante",
      claimed_product_name: "Postre Chaj\xE1 Individual",
      customer_description: "Abr\xED la bolsa y faltaba el postre Chaj\xE1 que ped\xED, solo vino la milanesa.",
      visual_evidence: null,
      hours_since_delivery: 3,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO 4 - Producto Equivocado con Evidencia
  // ==========================================
  {
    id: "CASO-4",
    case_number: "4",
    name: "Caso 4: Producto equivocado - Ensalada de frutas en vez de C\xE9sar (SIM_RULE_003)",
    description: "El cliente solicit\xF3 ensalada C\xE9sar pero recibi\xF3 ensalada de frutas. La evidencia fotogr\xE1fica constata la discrepancia.",
    customer: {
      customer_id: "CUST-4410",
      name: "Camila Bordaberry",
      phone: "+598 92 112 233",
      email: "camila.b@ejemplo.uy",
      delivery_address: "Rambla Gandhi 620, Punta Carretas, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-104",
      delivered: true,
      delivered_at_hours_ago: 2,
      order_timestamp: "2026-10-03T09:30:00Z",
      items: [
        { product_id: "PRD-401", name: "Ensalada C\xE9sar con Pollo", qty: 1, unit_price: 320, total_price: 320 },
        { product_id: "PRD-402", name: "Agua Mineral sin Gas", qty: 1, unit_price: 90, total_price: 90 }
      ],
      total_amount: 410,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-022",
      name: "Green Kitchen Salad & Bowl",
      category: "Ensaladas & Saludable",
      zone: "Punta Carretas"
    },
    claimed_product: {
      product_id: "PRD-401",
      name: "Ensalada C\xE9sar con Pollo",
      qty: 1,
      unit_price: 320,
      affected_amount: 320
    },
    total_order_amount: 410,
    total_affected_amount: 320,
    claim_reason_menu: "Producto equivocado",
    customer_claim_description: "Ped\xED ensalada C\xE9sar y me mandaron un pote con ensalada de frutas con kiwi y manzana.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: "photo",
      photo_description: "Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja) con etiqueta diferente.",
      is_sufficient: true,
      evaluation_status: "supports_claim",
      observations: [
        "Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja).",
        "La etiqueta y el contenido son diferentes al producto solicitado."
      ]
    },
    claim_status: "resuelto",
    current_step: {
      step_number: 4,
      step_name: "Resoluci\xF3n y Notificaci\xF3n",
      status: "completed",
      details: "Regla SIM_RULE_003 satisfecha. Reembolso formulado al cliente."
    },
    analysis_result: {
      detected_claim_type: "wrong_item",
      confidence: 0.95,
      amount_band: "low",
      matched_guards: [],
      matched_rules: ["SIM_RULE_003"]
    },
    expected_resolution: {
      decision: "proposed_refund",
      resolution_label: "Devoluci\xF3n propuesta por $320 UYU (SIM_RULE_003)",
      proposed_amount: 320,
      currency: "UYU",
      rationale: "Regla SIM_RULE_003: Producto equivocado comprobado mediante fotograf\xEDa legible en banda baja/media."
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: "none"
    },
    refund_options: {
      available_methods: ["original_payment_method", "wallet_credits"],
      customer_choice: "original_payment_method",
      choice_description: "Reembolso por $320 UYU a cuenta bancaria"
    },
    refund_status: "propuesta_simulada",
    customer_message: "Hola, lamentamos la confusi\xF3n con tu entrega. Confirmamos el producto equivocado y te proponemos la devoluci\xF3n de $320 UYU. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Benchmark Oficial ORT - Caso 4 (SYN-CASE-004 / BENCH-04)",
    claim_input_payload: {
      case_id: "SYN-CASE-004",
      order_id: "SYN-ORDER-104",
      order: {
        order_id: "SYN-ORDER-104",
        items: [
          { product_id: "PRD-401", name: "Ensalada C\xE9sar con Pollo", qty: 1, unit_price: 320 },
          { product_id: "PRD-402", name: "Agua Mineral sin Gas", qty: 1, unit_price: 90 }
        ],
        delivered_at_hours_ago: 2
      },
      menu_reason: "Producto equivocado",
      claimed_product_name: "Ensalada C\xE9sar con Pollo",
      customer_description: "Ped\xED ensalada C\xE9sar y me mandaron un pote con ensalada de frutas con kiwi y manzana.",
      visual_evidence: {
        description: "Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja) con etiqueta diferente."
      },
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO 5 - Dañado sin Foto Adjunta
  // ==========================================
  {
    id: "CASO-5",
    case_number: "5",
    name: "Caso 5: Botella de vino da\xF1ada sin evidencia adjunta (Solicitud de foto SIM_RULE_004)",
    description: "Reclamo de rotura en botella de vino sin fotograf\xEDa adjunta. En lugar de rechazar el caso, se solicita informaci\xF3n probatoria adicional.",
    customer: {
      customer_id: "CUST-5580",
      name: "Rodrigo G\xF3mez",
      phone: "+598 99 777 666",
      email: "rodrigo.g@ejemplo.uy",
      delivery_address: "Ellauri 950, Villa Biarritz, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-105",
      delivered: true,
      delivered_at_hours_ago: 5,
      order_timestamp: "2026-10-03T06:20:00Z",
      items: [
        { product_id: "PRD-501", name: "Botella de Vino Tannat Reserva", qty: 1, unit_price: 390, total_price: 390 }
      ],
      total_amount: 390,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-067",
      name: "Cava & Almac\xE9n Gourmet",
      category: "Bebidas & Licores",
      zone: "Villa Biarritz"
    },
    claimed_product: {
      product_id: "PRD-501",
      name: "Botella de Vino Tannat Reserva",
      qty: 1,
      unit_price: 390,
      affected_amount: 390
    },
    total_order_amount: 390,
    total_affected_amount: 390,
    claim_reason_menu: "Producto da\xF1ado",
    customer_claim_description: "La botella de vino lleg\xF3 rajada y el l\xEDquido se sali\xF3.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: "none",
      is_sufficient: false,
      evaluation_status: "not_provided",
      observations: []
    },
    claim_status: "en_analisis",
    current_step: {
      step_number: 3,
      step_name: "Evaluaci\xF3n de Reglas",
      status: "in_progress",
      details: "Regla SIM_RULE_004 activada. Esperando imagen del usuario."
    },
    analysis_result: {
      detected_claim_type: "damaged_product",
      confidence: 0.95,
      amount_band: "low",
      matched_guards: [],
      matched_rules: ["SIM_RULE_004"]
    },
    expected_resolution: {
      decision: "request_more_information",
      resolution_label: "Solicitud de evidencia fotogr\xE1fica legible (SIM_RULE_004)",
      proposed_amount: null,
      currency: "UYU",
      rationale: "Regla SIM_RULE_004: Para reclamos de da\xF1o o rotura es mandatorio contar con registro visual legible antes de resolver."
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: "none"
    },
    refund_options: {
      available_methods: ["pending"],
      customer_choice: "pending",
      choice_description: "Supeditada a la recepci\xF3n de la imagen probatoria."
    },
    refund_status: "pendiente_confirmacion",
    customer_message: "Hola, para poder evaluar tu reclamo necesitamos que nos env\xEDes una foto clara y legible donde se aprecie el estado del producto afectado. Quedamos a la espera de la imagen. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Benchmark Oficial ORT - Caso 5 (SYN-CASE-005 / BENCH-05)",
    claim_input_payload: {
      case_id: "SYN-CASE-005",
      order_id: "SYN-ORDER-105",
      order: {
        order_id: "SYN-ORDER-105",
        items: [
          { product_id: "PRD-501", name: "Botella de Vino Tannat Reserva", qty: 1, unit_price: 390 }
        ],
        delivered_at_hours_ago: 5
      },
      menu_reason: "Producto da\xF1ado",
      claimed_product_name: "Botella de Vino Tannat Reserva",
      customer_description: "La botella de vino lleg\xF3 rajada y el l\xEDquido se sali\xF3.",
      visual_evidence: null,
      hours_since_delivery: 5,
      customer_disputes_previous_resolution: false
    }
  },
  // ==========================================
  // CASO 10 - Importe Superior al Tope Automático
  // ==========================================
  {
    id: "CASO-10",
    case_number: "10",
    name: "Caso 10: Tabla de asado familiar superior a $600 UYU (Guarda SIM_GUARD_005)",
    description: "El importe del producto da\xF1ado asciende a $850 UYU, superando el tope de resoluci\xF3n autom\xE1tica de $600 UYU. Derivaci\xF3n obligatoria a mesa de operaciones.",
    customer: {
      customer_id: "CUST-9901",
      name: "Joaqu\xEDn Su\xE1rez",
      phone: "+598 99 000 112",
      email: "joaquin.s@ejemplo.uy",
      delivery_address: "Av. Sarmiento 2110, Parque Rod\xF3, Montevideo"
    },
    order_data: {
      order_id: "SYN-ORDER-110",
      delivered: true,
      delivered_at_hours_ago: 4,
      order_timestamp: "2026-10-03T07:15:00Z",
      items: [
        { product_id: "PRD-1001", name: "Tabla Asado Premium Familiar", qty: 1, unit_price: 850, total_price: 850 }
      ],
      total_amount: 850,
      currency: "UYU",
      previous_resolution: null
    },
    merchant: {
      merchant_id: "MERCH-077",
      name: "Parrilla & Brasas del Sur",
      category: "Parrilla",
      zone: "Parque Rod\xF3"
    },
    claimed_product: {
      product_id: "PRD-1001",
      name: "Tabla Asado Premium Familiar",
      qty: 1,
      unit_price: 850,
      affected_amount: 850
    },
    total_order_amount: 850,
    total_affected_amount: 850,
    claim_reason_menu: "Producto da\xF1ado",
    customer_claim_description: "La tabla de asado vino derramada por completo en la bolsa y la carne fr\xEDa y tirada.",
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: "photo",
      photo_description: "Se observa una bandeja met\xE1lica destapada con cortes de carne esparcidos y jugo graso derramado.",
      is_sufficient: true,
      evaluation_status: "supports_claim",
      observations: [
        "Se observa una bandeja met\xE1lica destapada con cortes de carne esparcidos.",
        "Hay jugo graso derramado en la base."
      ]
    },
    claim_status: "derivado_humano",
    current_step: {
      step_number: 2,
      step_name: "Validaci\xF3n de Guardas",
      status: "blocked",
      details: "Guarda SIM_GUARD_005 activada: el monto excede el tope de autonom\xEDa ($850 > $600)."
    },
    analysis_result: {
      detected_claim_type: "damaged_product",
      confidence: 0.95,
      amount_band: "high",
      matched_guards: ["SIM_GUARD_005"],
      matched_rules: []
    },
    expected_resolution: {
      decision: "human_review",
      resolution_label: "Derivaci\xF3n a supervisor por l\xEDmite de monto excedido (SIM_GUARD_005)",
      proposed_amount: null,
      currency: "UYU",
      rationale: "Guarda SIM_GUARD_005: Montos en banda alta (> $600 UYU) no pueden ser aprobados aut\xF3nomamente por salvaguarda de riesgo crediticio."
    },
    human_intervention: {
      required: true,
      reasons: ["amount_above_auto_limit"],
      escalation_priority: "high",
      analyst_note: "Monto de $850 UYU requiere autorizaci\xF3n manual de supervisor de operaciones."
    },
    refund_options: {
      available_methods: ["original_payment_method", "wallet_credits"],
      customer_choice: "pending",
      choice_description: "A definir tras an\xE1lisis del analista de cuenta."
    },
    refund_status: "derivada_a_agente",
    customer_message: "Hola, recibimos tu solicitud. Debido al valor del pedido, un representante de nuestro equipo revisar\xE1 tu caso para brindarte la mejor soluci\xF3n. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]",
    data_source: "Benchmark Oficial ORT - Caso 10 (SYN-CASE-010 / BENCH-10)",
    claim_input_payload: {
      case_id: "SYN-CASE-010",
      order_id: "SYN-ORDER-110",
      order: {
        order_id: "SYN-ORDER-110",
        items: [
          { product_id: "PRD-1001", name: "Tabla Asado Premium Familiar", qty: 1, unit_price: 850 }
        ],
        delivered_at_hours_ago: 4
      },
      menu_reason: "Producto da\xF1ado",
      claimed_product_name: "Tabla Asado Premium Familiar",
      customer_description: "La tabla de asado vino derramada por completo en la bolsa y la carne fr\xEDa y tirada.",
      visual_evidence: {
        description: "Se observa una bandeja met\xE1lica destapada con cortes de carne esparcidos y jugo graso derramado."
      },
      hours_since_delivery: 4,
      customer_disputes_previous_resolution: false
    }
  }
];

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = process.env.PORT || 3e3;
app.use(express.json({ limit: "15mb" }));
var ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/evaluate-claim", async (req, res) => {
  try {
    const input = req.body;
    if (!input || !input.order_id || !input.order) {
      return res.status(400).json({
        error: "Payload inv\xE1lido: faltan campos obligatorios (order_id, order)."
      });
    }
    if (input.visual_evidence?.image_base64 && ai) {
      try {
        const rawBase64 = input.visual_evidence.image_base64.replace(/^data:image\/\w+;base64,/, "");
        const visionResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: rawBase64
                  }
                },
                {
                  text: `Sos el m\xF3dulo de percepci\xF3n visual de un prototipo acad\xE9mico de reclamos post-entrega.
Mir\xE1 la imagen adjunta y describ\xED objetivamente lo que se observa f\xEDsicamente sobre el producto y su empaque en 1 o 2 oraciones.
REGLA CENTRAL ESTRICTA: NO menciones montos, devoluciones, dinero, compensaciones, culpa, negligencia ni fraude.
Solo describ\xED de forma neutral el estado observable del empaque, producto, l\xEDquidos o sellos.`
                }
              ]
            }
          ]
        });
        const visionDesc = visionResponse.text?.trim();
        if (visionDesc) {
          input.visual_evidence.description = visionDesc;
        }
      } catch (geminiError) {
        console.warn("Fallo en percepci\xF3n multimodal con Gemini, usando descripci\xF3n sint\xE9tica:", geminiError);
      }
    }
    const result = evaluateSyntheticClaim(input);
    return res.json(result);
  } catch (error) {
    console.error("Error al evaluar reclamo:", error);
    return res.status(500).json({ error: error.message || "Error interno del motor de evaluaci\xF3n" });
  }
});
app.get("/api/benchmark", (_req, res) => {
  const benchmarkWithResults = BENCHMARK_CASES.map((bench) => {
    const result = evaluateSyntheticClaim(bench.input);
    const passed = result.decision === bench.expected_decision && (bench.expected_rule_or_guard.startsWith("SIM_") ? result.rules_applied.includes(bench.expected_rule_or_guard) : bench.expected_review_reason ? result.human_review_reason.includes(bench.expected_review_reason) : true);
    return {
      ...bench,
      actual_result: result,
      passed
    };
  });
  return res.json({
    total: benchmarkWithResults.length,
    passed_count: benchmarkWithResults.filter((b) => b.passed).length,
    cases: benchmarkWithResults
  });
});
var serverDemoCases = [...DEFAULT_DEMO_CASES];
app.get("/api/demo-cases", (_req, res) => {
  return res.json({
    total: serverDemoCases.length,
    cases: serverDemoCases
  });
});
app.get("/api/demo-cases/search", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) {
    return res.json({ found: null });
  }
  const match = serverDemoCases.find(
    (c) => c.id.toLowerCase() === q || c.case_number.toLowerCase() === q || c.order_data.order_id.toLowerCase() === q || c.claim_input_payload.case_id.toLowerCase() === q || c.name.toLowerCase().includes(q) || c.claimed_product.name.toLowerCase().includes(q)
  );
  return res.json({ found: match || null });
});
app.post("/api/demo-cases", (req, res) => {
  const newCase = req.body;
  if (!newCase || !newCase.id || !newCase.name) {
    return res.status(400).json({ error: "Faltan campos obligatorios en el caso" });
  }
  const idx = serverDemoCases.findIndex((c) => c.id === newCase.id);
  if (idx >= 0) {
    serverDemoCases[idx] = newCase;
  } else {
    serverDemoCases.unshift(newCase);
  }
  return res.json({ success: true, count: serverDemoCases.length, case: newCase });
});
app.post("/api/demo-cases/reset", (_req, res) => {
  serverDemoCases = [...DEFAULT_DEMO_CASES];
  return res.json({ success: true, count: serverDemoCases.length, cases: serverDemoCases });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  const host = "0.0.0.0";
  app.listen(Number(port), host, () => {
    console.log(`Server listening on ${host}:${port} (mode: ${isProd ? "production" : "development"})`);
  });
}
startServer();
