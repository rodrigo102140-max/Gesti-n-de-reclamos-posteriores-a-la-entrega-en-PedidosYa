import type { DemoCaseRecord } from '../types/demoCase.ts';

/**
 * Catálogo Maestro Oficial de Casos de Demostración
 * PROTOTIPO ACADÉMICO - Universidad ORT Uruguay (Caso PedidosYa).
 * Contiene los casos del documento de especificación (Caso A, Caso B, Caso C/8, Caso 2)
 * y el repertorio complementario de casos de prueba del sistema.
 */
export const DEFAULT_DEMO_CASES: DemoCaseRecord[] = [
  // ==========================================
  // CASO A - Especificación del Requerimiento
  // ==========================================
  {
    id: 'CASO-A',
    case_number: 'A',
    name: 'Caso A: Helado derramado con envase roto en transporte',
    description:
      'Reclamo post-entrega por helado artesanal con envase dañado y derramado dentro de la bolsa. Aplica la regla SIM_RULE_002 con evidencia fotográfica suficiente en banda media.',
    customer: {
      customer_id: 'CUST-7821',
      name: 'Santiago Pérez',
      phone: '+598 99 123 456',
      email: 'santiago.perez@ejemplo.uy',
      delivery_address: 'Bv. España 2450, Apto 402, Pocitos, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-005',
      delivered: true,
      delivered_at_hours_ago: 1,
      order_timestamp: '2026-10-03T10:30:00Z',
      items: [
        {
          product_id: 'SYN-P-500',
          name: 'Helado 1 litro dulce de leche',
          qty: 1,
          unit_price: 540,
          total_price: 540,
        },
        {
          product_id: 'SYN-P-501',
          name: 'Conos de galleta',
          qty: 1,
          unit_price: 200,
          total_price: 200,
        },
      ],
      total_amount: 740,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-089',
      name: 'Heladería Artesanal Los Alpes',
      category: 'Heladerías & Postres',
      zone: 'Pocitos',
    },
    claimed_product: {
      product_id: 'SYN-P-500',
      name: 'Helado 1 litro dulce de leche',
      qty: 1,
      unit_price: 540,
      affected_amount: 540,
    },
    total_order_amount: 740,
    total_affected_amount: 540,
    claim_reason_menu: 'producto danado',
    customer_claim_description:
      'El helado de 1 litro llego con el pote roto y derretido, se derramo dentro de la bolsa.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: 'photo',
      photo_description:
        'Se observa un pote de helado con la tapa desprendida y el envase deformado. Hay contenido derramado dentro de una bolsa de delivery. El contenido visible tiene consistencia liquida.',
      is_sufficient: true,
      evaluation_status: 'supports_claim',
      observations: [
        'Se observa un pote de helado con la tapa desprendida y el envase deformado.',
        'Hay contenido derramado dentro de una bolsa de delivery.',
        'El contenido visible tiene consistencia liquida.',
      ],
    },
    claim_status: 'resuelto',
    current_step: {
      step_number: 4,
      step_name: 'Resolución y Notificación',
      status: 'completed',
      details: 'Regla SIM_RULE_002 satisfecha. Propuesta de reembolso formulada al cliente.',
    },
    analysis_result: {
      detected_claim_type: 'damaged_product',
      confidence: 0.95,
      amount_band: 'medium',
      matched_guards: [],
      matched_rules: ['SIM_RULE_002'],
    },
    expected_resolution: {
      decision: 'proposed_refund',
      resolution_label: 'Devolución propuesta por $540 UYU (SIM_RULE_002)',
      proposed_amount: 540,
      currency: 'UYU',
      rationale:
        'Regla SIM_RULE_002: Daño físico respaldado por evidencia fotográfica sin activar ninguna guarda. El monto ($540 UYU) no excede el límite de resolución automática ($600 UYU).',
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: 'none',
      analyst_note: 'No se requiere intervención humana. Resolución automática dentro de parámetros.',
    },
    refund_options: {
      available_methods: ['original_payment_method', 'wallet_credits'],
      customer_choice: 'original_payment_method',
      choice_description: 'Reembolso directo al medio de pago original (Tarjeta de Débito)',
    },
    refund_status: 'propuesta_simulada',
    customer_message:
      'Hola, lamentamos el inconveniente con tu pedido. De acuerdo a la evidencia adjunta, registramos el daño en el helado y te proponemos la devolución de $540 UYU. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Documento Sintético Post-Entrega - Caso A (SYN-CASE-003 / SYN-ORDER-005)',
    claim_input_payload: {
      case_id: 'SYN-CASE-003',
      order_id: 'SYN-ORDER-005',
      order: {
        order_id: 'SYN-ORDER-005',
        items: [
          { product_id: 'SYN-P-500', name: 'Helado 1 litro dulce de leche', qty: 1, unit_price: 540 },
          { product_id: 'SYN-P-501', name: 'Conos de galleta', qty: 1, unit_price: 200 },
        ],
        delivered_at_hours_ago: 1,
      },
      menu_reason: 'producto danado',
      claimed_product_name: 'Helado 1 litro dulce de leche',
      customer_description:
        'El helado de 1 litro llego con el pote roto y derretido, se derramo dentro de la bolsa.',
      visual_evidence: {
        description:
          'Se observa un pote de helado con la tapa desprendida y el envase deformado. Hay contenido derramado dentro de una bolsa de delivery. El contenido visible tiene consistencia liquida.',
      },
      hours_since_delivery: 1,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO B - Especificación del Requerimiento
  // ==========================================
  {
    id: 'CASO-B',
    case_number: 'B',
    name: 'Caso B: Evidencia contradice daño declarado en milanesa al pan',
    description:
      'El cliente afirma que el sándwich llegó aplastado y con pan roto, pero la fotografía demuestra el envoltorio y el alimento en óptimo estado sin alteraciones físicas.',
    customer: {
      customer_id: 'CUST-3912',
      name: 'Mariana Silva',
      phone: '+598 98 456 789',
      email: 'mariana.silva@ejemplo.uy',
      delivery_address: '18 de Julio 1320, Apto 901, Centro, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-004',
      delivered: true,
      delivered_at_hours_ago: 2,
      order_timestamp: '2026-10-03T09:15:00Z',
      items: [
        {
          product_id: 'SYN-P-400',
          name: 'Milanesa al pan',
          qty: 1,
          unit_price: 320,
          total_price: 320,
        },
        {
          product_id: 'SYN-P-401',
          name: 'Agua sin gas 600ml',
          qty: 1,
          unit_price: 90,
          total_price: 90,
        },
      ],
      total_amount: 410,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-042',
      name: 'Bar & Rotisería Central',
      category: 'Minutas & Sándwiches',
      zone: 'Centro',
    },
    claimed_product: {
      product_id: 'SYN-P-400',
      name: 'Milanesa al pan',
      qty: 1,
      unit_price: 320,
      affected_amount: 320,
    },
    total_order_amount: 410,
    total_affected_amount: 320,
    claim_reason_menu: 'producto danado',
    customer_claim_description:
      'La milanesa al pan llego aplastada y el pan roto, vino toda danada.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: 'photo',
      photo_description:
        'Se observa un sandwich de milanesa entero, con el pan cerrado y sin deformaciones. El envoltorio se ve intacto y sin manchas. No se observan roturas ni contenido derramado.',
      is_sufficient: false,
      evaluation_status: 'contradicts_claim',
      observations: [
        'Se observa un sandwich de milanesa entero, con el pan cerrado y sin deformaciones.',
        'El envoltorio se ve intacto y sin manchas.',
        'No se observan roturas ni contenido derramado.',
      ],
    },
    claim_status: 'derivado_humano',
    current_step: {
      step_number: 2,
      step_name: 'Validación de Guardas',
      status: 'blocked',
      details: 'Guarda SIM_GUARD_001 activada: la evidencia visual contradice el texto del reclamo.',
    },
    analysis_result: {
      detected_claim_type: 'damaged_product',
      confidence: 0.95,
      amount_band: 'low',
      matched_guards: ['SIM_GUARD_001'],
      matched_rules: [],
    },
    expected_resolution: {
      decision: 'human_review',
      resolution_label: 'Derivación a revisión humana por contradicción de evidencia (SIM_GUARD_001)',
      proposed_amount: null,
      currency: 'UYU',
      rationale:
        'Guarda SIM_GUARD_001: La evidencia contradice manifiestamente el reporte de producto destruido. El agente automático no debe conceder reembolsos indebidos.',
    },
    human_intervention: {
      required: true,
      reasons: ['evidence_contradicts_description'],
      escalation_priority: 'high',
      analyst_note:
        'Auditoría visual requerida: la imagen muestra producto íntegro. Contrastar con lote del comercio y reporte del repartidor.',
    },
    refund_options: {
      available_methods: ['none'],
      customer_choice: 'pending',
      choice_description: 'Suspendido a la espera del dictamen de la mesa de ayuda humana.',
    },
    refund_status: 'derivada_a_agente',
    customer_message:
      'Hola, recibimos tu solicitud. Para brindarte una respuesta precisa, se detectaron diferencias entre la información provista y la evidencia adjunta, por lo que un agente de nuestro equipo revisará tu caso. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Documento Sintético Post-Entrega - Caso B (SYN-CASE-006 / SYN-ORDER-004)',
    claim_input_payload: {
      case_id: 'SYN-CASE-006',
      order_id: 'SYN-ORDER-004',
      order: {
        order_id: 'SYN-ORDER-004',
        items: [
          { product_id: 'SYN-P-400', name: 'Milanesa al pan', qty: 1, unit_price: 320 },
          { product_id: 'SYN-P-401', name: 'Agua sin gas 600ml', qty: 1, unit_price: 90 },
        ],
        delivered_at_hours_ago: 2,
      },
      menu_reason: 'producto danado',
      claimed_product_name: 'Milanesa al pan',
      customer_description:
        'La milanesa al pan llego aplastada y el pan roto, vino toda danada.',
      visual_evidence: {
        description:
          'Se observa un sandwich de milanesa entero, con el pan cerrado y sin deformaciones. El envoltorio se ve intacto y sin manchas. No se observan roturas ni contenido derramado.',
      },
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO C / 8 - Especificación del Requerimiento
  // ==========================================
  {
    id: 'CASO-C',
    case_number: 'C',
    name: 'Caso C / 8: Ítem no figura en el pedido entregado (Flan casero)',
    description:
      'El cliente reclama la ausencia de una porción de flan casero, pero dicho producto nunca formó parte de la orden confirmada SYN-ORDER-004.',
    customer: {
      customer_id: 'CUST-5129',
      name: 'Gonzalo Méndez',
      phone: '+598 94 999 111',
      email: 'gonzalo.mendez@ejemplo.uy',
      delivery_address: 'Av. Brasil 2980, Pocitos, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-004',
      delivered: true,
      delivered_at_hours_ago: 1,
      order_timestamp: '2026-10-03T10:15:00Z',
      items: [
        {
          product_id: 'SYN-P-400',
          name: 'Milanesa al pan',
          qty: 1,
          unit_price: 320,
          total_price: 320,
        },
        {
          product_id: 'SYN-P-401',
          name: 'Agua sin gas 600ml',
          qty: 1,
          unit_price: 90,
          total_price: 90,
        },
      ],
      total_amount: 410,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-042',
      name: 'Bar & Rotisería Central',
      category: 'Minutas & Sándwiches',
      zone: 'Centro',
    },
    claimed_product: {
      product_id: 'NON-EXISTENT',
      name: 'Porción de flan casero',
      qty: 1,
      unit_price: 0,
      affected_amount: 0,
    },
    total_order_amount: 410,
    total_affected_amount: 0,
    claim_reason_menu: 'pedido incompleto',
    customer_claim_description:
      'Falta el flan casero que habia pedido, no vino en la entrega.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: 'none',
      is_sufficient: false,
      evaluation_status: 'not_required',
      observations: [],
    },
    claim_status: 'derivado_humano',
    current_step: {
      step_number: 1,
      step_name: 'Recepción y Clasificación',
      status: 'blocked',
      details: 'El producto reclamado no figura en el pedido entregado (product_not_in_order).',
    },
    analysis_result: {
      detected_claim_type: 'missing_item',
      confidence: 0.95,
      amount_band: 'low',
      matched_guards: [],
      matched_rules: [],
    },
    expected_resolution: {
      decision: 'human_review',
      resolution_label: 'Derivación a revisión humana: producto no existe en el pedido',
      proposed_amount: null,
      currency: 'UYU',
      rationale:
        'Criterio de consistencia de orden: el producto solicitado no coincide con los ítems facturados en SYN-ORDER-004. Requiere validación de carrito y cuenta con soporte humano.',
    },
    human_intervention: {
      required: true,
      reasons: ['product_not_in_order'],
      escalation_priority: 'medium',
      analyst_note:
        'El cliente podría haber dejado el ítem en el carrito sin confirmar o estar refiriéndose a una orden distinta.',
    },
    refund_options: {
      available_methods: ['none'],
      customer_choice: 'none',
      choice_description: 'No corresponde devolución económica por productos no facturados.',
    },
    refund_status: 'no_aplica',
    customer_message:
      'Hola, recibimos tu solicitud. Para brindarte una respuesta precisa, el artículo reclamado no figura registrado en las líneas del pedido entregado y será revisado manualmente por un representante de nuestro equipo. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Documento Sintético Post-Entrega - Caso C / 8 (SYN-CASE-008 / SYN-ORDER-004)',
    claim_input_payload: {
      case_id: 'SYN-CASE-008',
      order_id: 'SYN-ORDER-004',
      order: {
        order_id: 'SYN-ORDER-004',
        items: [
          { product_id: 'SYN-P-400', name: 'Milanesa al pan', qty: 1, unit_price: 320 },
          { product_id: 'SYN-P-401', name: 'Agua sin gas 600ml', qty: 1, unit_price: 90 },
        ],
        delivered_at_hours_ago: 1,
      },
      menu_reason: 'pedido incompleto',
      claimed_product_name: 'porcion de flan casero',
      customer_description: 'Falta el flan casero que habia pedido, no vino en la entrega.',
      visual_evidence: null,
      hours_since_delivery: 1,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO 2 - Especificación del Requerimiento
  // ==========================================
  {
    id: 'CASO-2',
    case_number: '2',
    name: 'Caso 2: Pizza Cuatro Quesos faltante en banda media (Cupón SIM_RULE_005)',
    description:
      'Faltante declarado de producto en banda media ($520 UYU, entre $401 y $600 UYU). Aplica compensación por cupón de compras sin exigir evidencia fotográfica.',
    customer: {
      customer_id: 'CUST-8832',
      name: 'Lucía Rossi',
      phone: '+598 91 888 777',
      email: 'lucia.rossi@ejemplo.uy',
      delivery_address: 'Bvar. Artigas 1820, Parque Rodó, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-102',
      delivered: true,
      delivered_at_hours_ago: 6,
      order_timestamp: '2026-10-03T05:00:00Z',
      items: [
        {
          product_id: 'PRD-201',
          name: 'Pizza Cuatro Quesos Familiar',
          qty: 1,
          unit_price: 520,
          total_price: 520,
        },
        {
          product_id: 'PRD-202',
          name: 'Refresco Cola 1.5L',
          qty: 1,
          unit_price: 160,
          total_price: 160,
        },
      ],
      total_amount: 680,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-015',
      name: 'Pizzería La Clásica',
      category: 'Pizzerías & Pastas',
      zone: 'Parque Rodó',
    },
    claimed_product: {
      product_id: 'PRD-201',
      name: 'Pizza Cuatro Quesos Familiar',
      qty: 1,
      unit_price: 520,
      affected_amount: 520,
    },
    total_order_amount: 680,
    total_affected_amount: 520,
    claim_reason_menu: 'Producto faltante',
    customer_claim_description:
      'El repartidor solo me entregó la botella de refresco, se olvidó de la pizza familiar.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: 'none',
      is_sufficient: true,
      evaluation_status: 'not_required',
      observations: [],
    },
    claim_status: 'resuelto',
    current_step: {
      step_number: 4,
      step_name: 'Resolución y Notificación',
      status: 'completed',
      details: 'Regla SIM_RULE_005 aplicada. Cupón de fidelización emitido.',
    },
    analysis_result: {
      detected_claim_type: 'missing_item',
      confidence: 0.95,
      amount_band: 'medium',
      matched_guards: [],
      matched_rules: ['SIM_RULE_005'],
    },
    expected_resolution: {
      decision: 'proposed_coupon',
      resolution_label: 'Cupón de compensación propuesto por $520 UYU (SIM_RULE_005)',
      proposed_amount: 520,
      currency: 'UYU',
      rationale:
        'Regla SIM_RULE_005: En faltantes de banda media ($401 a $600 UYU) sin disputa previa, el sistema ofrece retención mediante cupón de crédito instantáneo.',
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: 'none',
      analyst_note: 'Resolución automática completa. Fidelización cliente en banda media.',
    },
    refund_options: {
      available_methods: ['wallet_credits'],
      customer_choice: 'wallet_credits',
      choice_description: 'Cupón de crédito de $520 UYU para la próxima compra en la plataforma',
    },
    refund_status: 'propuesta_simulada',
    customer_message:
      'Hola, te pedimos disculpas por la falta en tu entrega. Te proponemos un cupón de compensación por valor de $520 UYU para tu próxima compra. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Benchmark Oficial ORT - Caso 2 (SYN-CASE-002 / BENCH-02)',
    claim_input_payload: {
      case_id: 'SYN-CASE-002',
      order_id: 'SYN-ORDER-102',
      order: {
        order_id: 'SYN-ORDER-102',
        items: [
          { product_id: 'PRD-201', name: 'Pizza Cuatro Quesos Familiar', qty: 1, unit_price: 520 },
          { product_id: 'PRD-202', name: 'Refresco Cola 1.5L', qty: 1, unit_price: 160 },
        ],
        delivered_at_hours_ago: 6,
      },
      menu_reason: 'Producto faltante',
      claimed_product_name: 'Pizza Cuatro Quesos Familiar',
      customer_description:
        'El repartidor solo me entregó la botella de refresco, se olvidó de la pizza familiar.',
      visual_evidence: null,
      hours_since_delivery: 6,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO 1 - Faltante en Banda Baja
  // ==========================================
  {
    id: 'CASO-1',
    case_number: '1',
    name: 'Caso 1: Postre Chajá faltante en banda baja (Reembolso SIM_RULE_001)',
    description:
      'Producto faltante con valor en banda baja ($250 UYU <= $400 UYU). Reembolso inmediato sin requerir fotografía.',
    customer: {
      customer_id: 'CUST-1044',
      name: 'Federico Alvez',
      phone: '+598 99 333 222',
      email: 'federico.alvez@ejemplo.uy',
      delivery_address: 'Av. Rivera 3100, Buceo, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-101',
      delivered: true,
      delivered_at_hours_ago: 3,
      order_timestamp: '2026-10-03T08:00:00Z',
      items: [
        { product_id: 'PRD-101', name: 'Milanesa Napolitana con Fritas', qty: 1, unit_price: 490, total_price: 490 },
        { product_id: 'PRD-102', name: 'Postre Chajá Individual', qty: 1, unit_price: 250, total_price: 250 },
      ],
      total_amount: 740,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-002',
      name: 'Bodegón Tradicional El Faro',
      category: 'Restaurantes',
      zone: 'Buceo',
    },
    claimed_product: {
      product_id: 'PRD-102',
      name: 'Postre Chajá Individual',
      qty: 1,
      unit_price: 250,
      affected_amount: 250,
    },
    total_order_amount: 740,
    total_affected_amount: 250,
    claim_reason_menu: 'Producto faltante',
    customer_claim_description: 'Abrí la bolsa y faltaba el postre Chajá que pedí, solo vino la milanesa.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: 'none',
      is_sufficient: true,
      evaluation_status: 'not_required',
      observations: [],
    },
    claim_status: 'resuelto',
    current_step: {
      step_number: 4,
      step_name: 'Resolución y Notificación',
      status: 'completed',
      details: 'Regla SIM_RULE_001 cumplida. Reembolso directo formulado.',
    },
    analysis_result: {
      detected_claim_type: 'missing_item',
      confidence: 0.95,
      amount_band: 'low',
      matched_guards: [],
      matched_rules: ['SIM_RULE_001'],
    },
    expected_resolution: {
      decision: 'proposed_refund',
      resolution_label: 'Devolución propuesta por $250 UYU (SIM_RULE_001)',
      proposed_amount: 250,
      currency: 'UYU',
      rationale:
        'Regla SIM_RULE_001: Faltante en banda baja ($250 <= $400 UYU) sin fricción probatoria.',
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: 'none',
    },
    refund_options: {
      available_methods: ['original_payment_method', 'wallet_credits'],
      customer_choice: 'original_payment_method',
      choice_description: 'Reembolso a la tarjeta de débito emisora',
    },
    refund_status: 'propuesta_simulada',
    customer_message:
      'Hola, lamentamos el inconveniente con tu pedido. Registramos la falta de Postre Chajá Individual y te proponemos la devolución de $250 UYU. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Benchmark Oficial ORT - Caso 1 (SYN-CASE-001 / BENCH-01)',
    claim_input_payload: {
      case_id: 'SYN-CASE-001',
      order_id: 'SYN-ORDER-101',
      order: {
        order_id: 'SYN-ORDER-101',
        items: [
          { product_id: 'PRD-101', name: 'Milanesa Napolitana con Fritas', qty: 1, unit_price: 490 },
          { product_id: 'PRD-102', name: 'Postre Chajá Individual', qty: 1, unit_price: 250 },
        ],
        delivered_at_hours_ago: 3,
      },
      menu_reason: 'Producto faltante',
      claimed_product_name: 'Postre Chajá Individual',
      customer_description: 'Abrí la bolsa y faltaba el postre Chajá que pedí, solo vino la milanesa.',
      visual_evidence: null,
      hours_since_delivery: 3,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO 4 - Producto Equivocado con Evidencia
  // ==========================================
  {
    id: 'CASO-4',
    case_number: '4',
    name: 'Caso 4: Producto equivocado - Ensalada de frutas en vez de César (SIM_RULE_003)',
    description:
      'El cliente solicitó ensalada César pero recibió ensalada de frutas. La evidencia fotográfica constata la discrepancia.',
    customer: {
      customer_id: 'CUST-4410',
      name: 'Camila Bordaberry',
      phone: '+598 92 112 233',
      email: 'camila.b@ejemplo.uy',
      delivery_address: 'Rambla Gandhi 620, Punta Carretas, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-104',
      delivered: true,
      delivered_at_hours_ago: 2,
      order_timestamp: '2026-10-03T09:30:00Z',
      items: [
        { product_id: 'PRD-401', name: 'Ensalada César con Pollo', qty: 1, unit_price: 320, total_price: 320 },
        { product_id: 'PRD-402', name: 'Agua Mineral sin Gas', qty: 1, unit_price: 90, total_price: 90 },
      ],
      total_amount: 410,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-022',
      name: 'Green Kitchen Salad & Bowl',
      category: 'Ensaladas & Saludable',
      zone: 'Punta Carretas',
    },
    claimed_product: {
      product_id: 'PRD-401',
      name: 'Ensalada César con Pollo',
      qty: 1,
      unit_price: 320,
      affected_amount: 320,
    },
    total_order_amount: 410,
    total_affected_amount: 320,
    claim_reason_menu: 'Producto equivocado',
    customer_claim_description:
      'Pedí ensalada César y me mandaron un pote con ensalada de frutas con kiwi y manzana.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: 'photo',
      photo_description:
        'Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja) con etiqueta diferente.',
      is_sufficient: true,
      evaluation_status: 'supports_claim',
      observations: [
        'Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja).',
        'La etiqueta y el contenido son diferentes al producto solicitado.',
      ],
    },
    claim_status: 'resuelto',
    current_step: {
      step_number: 4,
      step_name: 'Resolución y Notificación',
      status: 'completed',
      details: 'Regla SIM_RULE_003 satisfecha. Reembolso formulado al cliente.',
    },
    analysis_result: {
      detected_claim_type: 'wrong_item',
      confidence: 0.95,
      amount_band: 'low',
      matched_guards: [],
      matched_rules: ['SIM_RULE_003'],
    },
    expected_resolution: {
      decision: 'proposed_refund',
      resolution_label: 'Devolución propuesta por $320 UYU (SIM_RULE_003)',
      proposed_amount: 320,
      currency: 'UYU',
      rationale:
        'Regla SIM_RULE_003: Producto equivocado comprobado mediante fotografía legible en banda baja/media.',
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: 'none',
    },
    refund_options: {
      available_methods: ['original_payment_method', 'wallet_credits'],
      customer_choice: 'original_payment_method',
      choice_description: 'Reembolso por $320 UYU a cuenta bancaria',
    },
    refund_status: 'propuesta_simulada',
    customer_message:
      'Hola, lamentamos la confusión con tu entrega. Confirmamos el producto equivocado y te proponemos la devolución de $320 UYU. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Benchmark Oficial ORT - Caso 4 (SYN-CASE-004 / BENCH-04)',
    claim_input_payload: {
      case_id: 'SYN-CASE-004',
      order_id: 'SYN-ORDER-104',
      order: {
        order_id: 'SYN-ORDER-104',
        items: [
          { product_id: 'PRD-401', name: 'Ensalada César con Pollo', qty: 1, unit_price: 320 },
          { product_id: 'PRD-402', name: 'Agua Mineral sin Gas', qty: 1, unit_price: 90 },
        ],
        delivered_at_hours_ago: 2,
      },
      menu_reason: 'Producto equivocado',
      claimed_product_name: 'Ensalada César con Pollo',
      customer_description:
        'Pedí ensalada César y me mandaron un pote con ensalada de frutas con kiwi y manzana.',
      visual_evidence: {
        description:
          'Se visualiza un pote transparente que contiene trozos de fruta picada (kiwi, manzana, naranja) con etiqueta diferente.',
      },
      hours_since_delivery: 2,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO 5 - Dañado sin Foto Adjunta
  // ==========================================
  {
    id: 'CASO-5',
    case_number: '5',
    name: 'Caso 5: Botella de vino dañada sin evidencia adjunta (Solicitud de foto SIM_RULE_004)',
    description:
      'Reclamo de rotura en botella de vino sin fotografía adjunta. En lugar de rechazar el caso, se solicita información probatoria adicional.',
    customer: {
      customer_id: 'CUST-5580',
      name: 'Rodrigo Gómez',
      phone: '+598 99 777 666',
      email: 'rodrigo.g@ejemplo.uy',
      delivery_address: 'Ellauri 950, Villa Biarritz, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-105',
      delivered: true,
      delivered_at_hours_ago: 5,
      order_timestamp: '2026-10-03T06:20:00Z',
      items: [
        { product_id: 'PRD-501', name: 'Botella de Vino Tannat Reserva', qty: 1, unit_price: 390, total_price: 390 },
      ],
      total_amount: 390,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-067',
      name: 'Cava & Almacén Gourmet',
      category: 'Bebidas & Licores',
      zone: 'Villa Biarritz',
    },
    claimed_product: {
      product_id: 'PRD-501',
      name: 'Botella de Vino Tannat Reserva',
      qty: 1,
      unit_price: 390,
      affected_amount: 390,
    },
    total_order_amount: 390,
    total_affected_amount: 390,
    claim_reason_menu: 'Producto dañado',
    customer_claim_description: 'La botella de vino llegó rajada y el líquido se salió.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: false,
      evidence_type: 'none',
      is_sufficient: false,
      evaluation_status: 'not_provided',
      observations: [],
    },
    claim_status: 'en_analisis',
    current_step: {
      step_number: 3,
      step_name: 'Evaluación de Reglas',
      status: 'in_progress',
      details: 'Regla SIM_RULE_004 activada. Esperando imagen del usuario.',
    },
    analysis_result: {
      detected_claim_type: 'damaged_product',
      confidence: 0.95,
      amount_band: 'low',
      matched_guards: [],
      matched_rules: ['SIM_RULE_004'],
    },
    expected_resolution: {
      decision: 'request_more_information',
      resolution_label: 'Solicitud de evidencia fotográfica legible (SIM_RULE_004)',
      proposed_amount: null,
      currency: 'UYU',
      rationale:
        'Regla SIM_RULE_004: Para reclamos de daño o rotura es mandatorio contar con registro visual legible antes de resolver.',
    },
    human_intervention: {
      required: false,
      reasons: [],
      escalation_priority: 'none',
    },
    refund_options: {
      available_methods: ['pending'],
      customer_choice: 'pending',
      choice_description: 'Supeditada a la recepción de la imagen probatoria.',
    },
    refund_status: 'pendiente_confirmacion',
    customer_message:
      'Hola, para poder evaluar tu reclamo necesitamos que nos envíes una foto clara y legible donde se aprecie el estado del producto afectado. Quedamos a la espera de la imagen. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Benchmark Oficial ORT - Caso 5 (SYN-CASE-005 / BENCH-05)',
    claim_input_payload: {
      case_id: 'SYN-CASE-005',
      order_id: 'SYN-ORDER-105',
      order: {
        order_id: 'SYN-ORDER-105',
        items: [
          { product_id: 'PRD-501', name: 'Botella de Vino Tannat Reserva', qty: 1, unit_price: 390 },
        ],
        delivered_at_hours_ago: 5,
      },
      menu_reason: 'Producto dañado',
      claimed_product_name: 'Botella de Vino Tannat Reserva',
      customer_description: 'La botella de vino llegó rajada y el líquido se salió.',
      visual_evidence: null,
      hours_since_delivery: 5,
      customer_disputes_previous_resolution: false,
    },
  },

  // ==========================================
  // CASO 10 - Importe Superior al Tope Automático
  // ==========================================
  {
    id: 'CASO-10',
    case_number: '10',
    name: 'Caso 10: Tabla de asado familiar superior a $600 UYU (Guarda SIM_GUARD_005)',
    description:
      'El importe del producto dañado asciende a $850 UYU, superando el tope de resolución automática de $600 UYU. Derivación obligatoria a mesa de operaciones.',
    customer: {
      customer_id: 'CUST-9901',
      name: 'Joaquín Suárez',
      phone: '+598 99 000 112',
      email: 'joaquin.s@ejemplo.uy',
      delivery_address: 'Av. Sarmiento 2110, Parque Rodó, Montevideo',
    },
    order_data: {
      order_id: 'SYN-ORDER-110',
      delivered: true,
      delivered_at_hours_ago: 4,
      order_timestamp: '2026-10-03T07:15:00Z',
      items: [
        { product_id: 'PRD-1001', name: 'Tabla Asado Premium Familiar', qty: 1, unit_price: 850, total_price: 850 },
      ],
      total_amount: 850,
      currency: 'UYU',
      previous_resolution: null,
    },
    merchant: {
      merchant_id: 'MERCH-077',
      name: 'Parrilla & Brasas del Sur',
      category: 'Parrilla',
      zone: 'Parque Rodó',
    },
    claimed_product: {
      product_id: 'PRD-1001',
      name: 'Tabla Asado Premium Familiar',
      qty: 1,
      unit_price: 850,
      affected_amount: 850,
    },
    total_order_amount: 850,
    total_affected_amount: 850,
    claim_reason_menu: 'Producto dañado',
    customer_claim_description: 'La tabla de asado vino derramada por completo en la bolsa y la carne fría y tirada.',
    customer_disputes_previous: false,
    evidence: {
      has_evidence: true,
      evidence_type: 'photo',
      photo_description:
        'Se observa una bandeja metálica destapada con cortes de carne esparcidos y jugo graso derramado.',
      is_sufficient: true,
      evaluation_status: 'supports_claim',
      observations: [
        'Se observa una bandeja metálica destapada con cortes de carne esparcidos.',
        'Hay jugo graso derramado en la base.',
      ],
    },
    claim_status: 'derivado_humano',
    current_step: {
      step_number: 2,
      step_name: 'Validación de Guardas',
      status: 'blocked',
      details: 'Guarda SIM_GUARD_005 activada: el monto excede el tope de autonomía ($850 > $600).',
    },
    analysis_result: {
      detected_claim_type: 'damaged_product',
      confidence: 0.95,
      amount_band: 'high',
      matched_guards: ['SIM_GUARD_005'],
      matched_rules: [],
    },
    expected_resolution: {
      decision: 'human_review',
      resolution_label: 'Derivación a supervisor por límite de monto excedido (SIM_GUARD_005)',
      proposed_amount: null,
      currency: 'UYU',
      rationale:
        'Guarda SIM_GUARD_005: Montos en banda alta (> $600 UYU) no pueden ser aprobados autónomamente por salvaguarda de riesgo crediticio.',
    },
    human_intervention: {
      required: true,
      reasons: ['amount_above_auto_limit'],
      escalation_priority: 'high',
      analyst_note: 'Monto de $850 UYU requiere autorización manual de supervisor de operaciones.',
    },
    refund_options: {
      available_methods: ['original_payment_method', 'wallet_credits'],
      customer_choice: 'pending',
      choice_description: 'A definir tras análisis del analista de cuenta.',
    },
    refund_status: 'derivada_a_agente',
    customer_message:
      'Hola, recibimos tu solicitud. Debido al valor del pedido, un representante de nuestro equipo revisará tu caso para brindarte la mejor solución. [PROTOTIPO: propuesta simulada, no se ejecuto ningun pago.]',
    data_source: 'Benchmark Oficial ORT - Caso 10 (SYN-CASE-010 / BENCH-10)',
    claim_input_payload: {
      case_id: 'SYN-CASE-010',
      order_id: 'SYN-ORDER-110',
      order: {
        order_id: 'SYN-ORDER-110',
        items: [
          { product_id: 'PRD-1001', name: 'Tabla Asado Premium Familiar', qty: 1, unit_price: 850 },
        ],
        delivered_at_hours_ago: 4,
      },
      menu_reason: 'Producto dañado',
      claimed_product_name: 'Tabla Asado Premium Familiar',
      customer_description: 'La tabla de asado vino derramada por completo en la bolsa y la carne fría y tirada.',
      visual_evidence: {
        description: 'Se observa una bandeja metálica destapada con cortes de carne esparcidos y jugo graso derramado.',
      },
      hours_since_delivery: 4,
      customer_disputes_previous_resolution: false,
    },
  },
];
