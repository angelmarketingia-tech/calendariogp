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

    if (!process.env.OPENAI_API_KEY) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const lastMsg = messages[messages.length - 1];
      const hasImage = Array.isArray(lastMsg?.content) && lastMsg.content.some((c: any) => c.type === 'image_url');
      const simResponse = hasImage
        ? `## 🎨 Análisis de tu pieza\n\n**1. Jerarquía Visual:** La composición presenta elementos que compiten por atención. Asegúrate de que el CTA sea el elemento más prominente después del logo.\n\n**2. Copy:** Verifica que el texto no supere el 20% del área total (regla Meta). Usa fuente bold mínimo 24pt para el título principal.\n\n**3. 🎯 CTR Estimado:** Medio-Alto (potencial de 2-4%)\n\n**✅ 3 mejoras inmediatas:**\n- Aumenta contraste entre texto y fondo (ratio mínimo 4.5:1)\n- Agrega un marco o overlay semitransparente detrás del copy\n- El botón CTA debe tener color opuesto al fondo dominante\n\n⚠️ *Nota: Análisis en modo simulación. Activa la API Key para análisis real con IA.*`
        : `## 💡 Recomendación para Meta Ads\n\n**Algoritmo Andromeda** prioriza creatividades que generan engagement en los primeros 3 segundos.\n\n**Para piezas estáticas (Feed):**\n- Resolución: 1080x1080px · Ratio 1:1\n- Texto máximo: 20% del área\n- CTA claro: mínimo 40px de altura en mobile\n\n**Para Historias:**\n- 1080x1920px · Ratio 9:16\n- Zona segura: deja 250px arriba y abajo sin elementos clave\n\n**CTR promedio por vertical de apuestas en LATAM:** 1.8% - 3.2%\n\n⚠️ *Modo simulación activo. Conecta tu API Key para respuestas personalizadas.*`;
      return NextResponse.json({ content: simResponse });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1000,
    });

    return NextResponse.json({ content: response.choices[0].message.content });
  } catch (error: unknown) {
    console.error("Error in AI Chat:", error);
    const message = error instanceof Error ? error.message : "Error interno del chatbot.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
