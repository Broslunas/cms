import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { type, text, context, option } = await req.json();

  if (!text && !context) {
     return NextResponse.json({ error: "Texto o contexto requerido" }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: (type === 'seo' || type === 'tags') ? "application/json" : "text/plain",
      }
    });

    let systemInstruction = "Eres un asistente de redacción experto en CMS y SEO.";
    let userPrompt = "";

    switch (type) {
        case 'grammar':
            userPrompt = `Revisa y corrige la gramática y ortografía del siguiente texto. 
            IMPORTANTE:
            1. Mantén estrictamente el formato Markdown (negritas, enlaces, código, headers).
            2. No cambies el estilo ni el tono, solo corrige errores.
            3. Devuelve ÚNICAMENTE el texto corregido, sin explicaciones ni bloques de código extra (ej: no envuelvas en \`\`\`markdown).
            
            Texto a corregir:
            ${text}`;
            break;

        case 'tone':
            let toneDesc = "profesional";
            if (option === 'formal') toneDesc = "más formal, corporativo y serio";
            if (option === 'shorter') toneDesc = "más conciso, directo y breve (resume sin perder información clave)";
            if (option === 'funnier') toneDesc = "más divertido, casual y con un toque de humor";
            
            userPrompt = `Reescribe el siguiente texto para que su tono sea ${toneDesc}.
            IMPORTANTE:
            1. Mantén el formato Markdown (negritas, enlaces, código).
            2. Devuelve ÚNICAMENTE el texto reescrito.
            
            Texto original:
            ${text}`;
            break;

        case 'seo':
            userPrompt = `Analiza el siguiente contenido y genera metadatos SEO optimizados.
            Genera un JSON con:
            - "title": Título atractivo y optimizado (máx 60 caracteres).
            - "description": Meta descripción persuasiva (máx 160 caracteres).
            
            Contenido del post:
            ${context || text}`;
            break;

        case 'tags':
            userPrompt = `Analiza el siguiente contenido y sugiere etiquetas (tags) relevantes.
            Genera un JSON con:
            - "tags": Array de strings con 5-8 etiquetas relevantes en minúsculas.
            
            Contenido del post:
            ${context || text}`;
            break;

        case 'chat':
            systemInstruction = `Eres un asistente inteligente integrado en un editor de CMS. 
            Tienes acceso al contenido del post que el usuario está editando.
            Responde preguntas sobre el contenido, ayuda a redactar, sugerir ideas o criticar el texto.
            Sé conciso y útil.`;
            
            userPrompt = `
            CONTEXTO DEL POST:
            ---
            ${context}
            ---

            PREGUNTA DEL USUARIO:
            ${text}
            `;
            break;

        default:
            return NextResponse.json({ error: "Tipo de operación no válido" }, { status: 400 });
    }

    const result = await model.generateContent([
        { text: systemInstruction },
        { text: userPrompt }
    ]);
    const response = await result.response;
    const outputText = response.text();

    if (type === 'seo' || type === 'tags') {
        try {
            const json = JSON.parse(outputText);
            return NextResponse.json(json);
        } catch (e) {
            // Fallback parsing logic similar to existing generation route
            const cleaned = outputText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
            return NextResponse.json(JSON.parse(cleaned));
        }
    }

    return NextResponse.json({ result: outputText });

  } catch (error: any) {
    console.error("Error en AI Process API:", error);
    return NextResponse.json({ error: error.message || "Error procesando solicitud AI" }, { status: 500 });
  }
}
