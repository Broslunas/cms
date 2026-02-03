import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { prompt, schema } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "El prompt es requerido" }, { status: 400 });
  }

  try {
    // Usamos gemini-2.0-flash que es muy rápido y capaz
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const schemaStr = schema 
      ? JSON.stringify(schema, null, 2) 
      : JSON.stringify({
          "title": "string",
          "slug": "string",
          "tags": ["string"],
          "date": "string (YYYY-MM-DD)",
          "description": "string"
        }, null, 2);

    const systemPrompt = `
      Eres un experto redactor de contenido y especialista en SEO.
      Tu tarea es generar un post completo (metadatos y contenido Markdown) basado en las instrucciones del usuario.

      ESQUEMA DE METADATOS OBLIGATORIO:
      ${schemaStr}

      INSTRUCCIONES CRÍTICAS:
      1. Genera un contenido Markdown de alta calidad, extenso y bien estructurado.
      2. Los metadatos deben seguir EXACTAMENTE el esquema proporcionado. No añadas ni quites campos.
      3. El slug debe ser amigable para URL y basado en el título.
      4. CAMPOS TIPO ARRAY (como tags): Genera estrictamente un array JSON estándar (ej: ["tag1", "tag2"]). NUNCA uses llaves {} ni formato de objeto para esto.
      5. Si el esquema contiene campos como 'transcription' (array de objetos), genera datos coherentes siguiendo ese formato interno.
      6. Responde ÚNICAMENTE con el objeto JSON estructurado así:
      {
        "metadata": { ... },
        "content": "# Título\n\nContenido aquí..."
      }
    `;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `INSTRUCCIÓN DEL USUARIO: ${prompt}` }
    ]);

    const response = await result.response;
    const text = response.text();

    try {
        const json = JSON.parse(text);
        return NextResponse.json(json);
    } catch (e) {
        console.error("Error al parsear JSON de la IA:", text);
        // Si falla el parseo, intentamos limpiar el texto por si tiene bloques de código markdown
        const cleanedText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        try {
            const json = JSON.parse(cleanedText);
            return NextResponse.json(json);
        } catch (e2) {
            return NextResponse.json({ 
                error: "La IA generó un formato inválido", 
                raw: text 
            }, { status: 500 });
        }
    }

  } catch (error: any) {
    console.error("Error en API de IA:", error);
    return NextResponse.json({ 
        error: "Error al generar contenido con IA", 
        message: error.message 
    }, { status: 500 });
  }
}
