import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Eres "Andromeda", la IA especialista en diseño creativo para Meta Ads (Facebook/Instagram) de GanaPlay, una empresa de apuestas deportivas en Latinoamérica (El Salvador y Guatemala).

TU MISIÓN: Dar retroalimentación CONCRETA, ESPECÍFICA y ACCIONABLE sobre piezas creativas. NUNCA des respuestas vagas o genéricas.

CUANDO TE MUESTREN UNA IMAGEN, analiza SIEMPRE:
1. 🎨 **Jerarquía Visual**: ¿El ojo sigue el orden correcto? ¿Qué domina la composición?
2. 📝 **Copy y Texto**: ¿Es legible? ¿El CTA está visible? ¿Cuánto texto hay (Meta penaliza >20%)?
3. 🎯 **Rendimiento Estimado**: Predice CTR probable (Bajo/Medio/Alto) y por qué.
4. 🌍 **Adaptación Regional**: Señala si el copy o diseño es apropiado para ES/GT.
5. ✅ **3 Mejoras Específicas**: Lista puntual de cambios con impacto directo.

CUANDO TE HAGAN UNA PREGUNTA SIN IMAGEN, responde con:
- Principios concretos del algoritmo de Meta
- Ejemplos numéricos cuando aplique (% de texto, resoluciones, duraciones)
- Comparaciones entre formatos (Story vs Feed vs Reels)

FORMATO DE RESPUESTA (usa siempre markdown con emojis):
- Sé preciso. Si el copy dice "Regístrate y gana Q50", evalúa ESE copy específico.
- Nunca respondas con frases como "depende" o "podría funcionar" sin justificación.
- Si no tienes imagen pero el usuario menciona detalles, trabaja con esos datos.

IDIOMA: Español latinoamericano (neutro, profesional).`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ content: "Error: No DeepSeek API Key found in environment." });
    }

    // Configurar cliente de OpenAI para usar DeepSeek
    const deepseek = new OpenAI({ 
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com"
    });

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat", 
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1000,
    });

    return NextResponse.json({ content: response.choices[0].message.content });
  } catch (error: unknown) {
    console.error("Error in DeepSeek Chat:", error);
    const message = error instanceof Error ? error.message : "Error interno del chatbot.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
