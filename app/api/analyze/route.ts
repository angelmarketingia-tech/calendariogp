import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, copy, format, country, dimensions } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No se proporcionó la imagen del creativo." }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    // Si no hay key, simulamos (como antes, modo demo)
    if (!apiKey) {
      console.log("No DEEPSEEK_API_KEY found, returning simulated response.");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return NextResponse.json({
        rating: 7,
        explanation: "Modo simulación: Para una auditoría real, agrega la API Key de DeepSeek.",
        validation: "SIMULADO",
        color: "yellow"
      });
    }

    const deepseek = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com"
    });

    const prompt = `
Eres un experto en marketing digital y Meta Ads, y tu tarea es auditar el trabajo de un diseñador para la agencia GanaPlay.

IMPORTANTE: El usuario te ha pasado una imagen, pero actualmente estamos operando en un modo de análisis técnico basado en los datos del requerimiento, ya que el motor de visión directo no está disponible inmediatamente para esta versión de DeepSeek. Sin embargo, procesaremos el análisis basado en el contexto y los metadatos.

DETALLES DEL REQUERIMIENTO:
- País Objetivo: "${country || 'No especificado'}"
- Dimensiones Requeridas: "${dimensions || 'No especificado'}"
- Formato: "${format}"
- Copy Base / Orientativo: "${copy}"

CALIFICA LA VIABILIDAD SEGÚN TERCERAS MÉTODAS DE META ADS:
1. 'rating': Número entero del 1 al 10.
2. 'color': 'red' (1-4), 'yellow' (5-7), o 'green' (8-10).
3. 'explanation': Justificación técnica centrada en si el copy propuesto y el formato de ${dimensions} funcionará para ${country}.
4. 'validation': "APROBADO", "RECHAZADO" o "REQUIERE CAMBIOS".

OBLIGATORIO: Devuelve únicamente un objeto JSON válido con estas 4 claves. Sin Markdown.
`;

    // Usaremos deepseek-chat para una evaluación textual rigurosa
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = response.choices[0].message.content;
    const parsed = JSON.parse(aiResponse || "{}");

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error("Error analyzing instructions:", error);
    const message = error instanceof Error ? error.message : "Error interno al analizar con DeepSeek.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
