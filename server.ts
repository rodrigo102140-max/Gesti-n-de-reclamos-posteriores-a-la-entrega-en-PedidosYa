import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { evaluateSyntheticClaim } from './src/lib/claimEngine.ts';
import { BENCHMARK_CASES } from './src/data/benchmarkCases.ts';
import { DEFAULT_DEMO_CASES } from './src/data/demoCasesData.ts';
import type { SyntheticClaimInput } from './src/types/claim.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Inicialización de Gemini SDK en el servidor según gemini-api skill
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Endpoint principal de resolución de reclamos sintéticos.
 * Prototipo Académico - Universidad ORT Uruguay (Caso PedidosYa).
 */
app.post('/api/evaluate-claim', async (req, res) => {
  try {
    const input: SyntheticClaimInput = req.body;

    if (!input || !input.order_id || !input.order) {
      return res.status(400).json({
        error: 'Payload inválido: faltan campos obligatorios (order_id, order).',
      });
    }

    // Si viene una imagen base64 y tenemos Gemini configurado, realizamos la percepción visual objetiva
    if (input.visual_evidence?.image_base64 && ai) {
      try {
        const rawBase64 = input.visual_evidence.image_base64.replace(/^data:image\/\w+;base64,/, '');
        const visionResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: rawBase64,
                  },
                },
                {
                  text: `Sos el módulo de percepción visual de un prototipo académico de reclamos post-entrega.
Mirá la imagen adjunta y describí objetivamente lo que se observa físicamente sobre el producto y su empaque en 1 o 2 oraciones.
REGLA CENTRAL ESTRICTA: NO menciones montos, devoluciones, dinero, compensaciones, culpa, negligencia ni fraude.
Solo describí de forma neutral el estado observable del empaque, producto, líquidos o sellos.`,
                },
              ],
            },
          ],
        });

        const visionDesc = visionResponse.text?.trim();
        if (visionDesc) {
          input.visual_evidence.description = visionDesc;
        }
      } catch (geminiError) {
        console.warn('Fallo en percepción multimodal con Gemini, usando descripción sintética:', geminiError);
      }
    }

    // Ejecutar el motor de reglas simuladas
    const result = evaluateSyntheticClaim(input);
    return res.json(result);
  } catch (error: any) {
    console.error('Error al evaluar reclamo:', error);
    return res.status(500).json({ error: error.message || 'Error interno del motor de evaluación' });
  }
});

/**
 * Endpoint para obtener el suite de benchmark con resultados pre-calculados.
 */
app.get('/api/benchmark', (_req, res) => {
  const benchmarkWithResults = BENCHMARK_CASES.map((bench) => {
    const result = evaluateSyntheticClaim(bench.input);
    const passed =
      result.decision === bench.expected_decision &&
      (bench.expected_rule_or_guard.startsWith('SIM_')
        ? result.rules_applied.includes(bench.expected_rule_or_guard)
        : bench.expected_review_reason
        ? result.human_review_reason.includes(bench.expected_review_reason)
        : true);

    return {
      ...bench,
      actual_result: result,
      passed,
    };
  });

  return res.json({
    total: benchmarkWithResults.length,
    passed_count: benchmarkWithResults.filter((b) => b.passed).length,
    cases: benchmarkWithResults,
  });
});

// Registro en memoria de casos de demostración en el servidor
let serverDemoCases = [...DEFAULT_DEMO_CASES];

/**
 * Endpoints para el Registro de Casos de Demostración
 */
app.get('/api/demo-cases', (_req, res) => {
  return res.json({
    total: serverDemoCases.length,
    cases: serverDemoCases,
  });
});

app.get('/api/demo-cases/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json({ found: null });
  }

  const match = serverDemoCases.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.case_number.toLowerCase() === q ||
      c.order_data.order_id.toLowerCase() === q ||
      c.claim_input_payload.case_id.toLowerCase() === q ||
      c.name.toLowerCase().includes(q) ||
      c.claimed_product.name.toLowerCase().includes(q)
  );

  return res.json({ found: match || null });
});

app.post('/api/demo-cases', (req, res) => {
  const newCase = req.body;
  if (!newCase || !newCase.id || !newCase.name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios en el caso' });
  }

  const idx = serverDemoCases.findIndex((c) => c.id === newCase.id);
  if (idx >= 0) {
    serverDemoCases[idx] = newCase;
  } else {
    serverDemoCases.unshift(newCase);
  }

  return res.json({ success: true, count: serverDemoCases.length, case: newCase });
});

app.post('/api/demo-cases/reset', (_req, res) => {
  serverDemoCases = [...DEFAULT_DEMO_CASES];
  return res.json({ success: true, count: serverDemoCases.length, cases: serverDemoCases });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const host = '0.0.0.0';
  app.listen(Number(port), host, () => {
    console.log(`Server listening on ${host}:${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
