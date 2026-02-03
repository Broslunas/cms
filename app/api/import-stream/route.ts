import { auth } from "@/lib/auth";
import { listContentFiles, getFileContent } from "@/lib/octokit";
import { parseMarkdown } from "@/lib/markdown";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { NextRequest } from "next/server";
import {
  parseContentConfig,
  detectCollectionFromPath,
  validateAgainstSchema,
} from "@/lib/config-parser";

/**
 * Endpoint de streaming para importación con actualizaciones de progreso en tiempo real
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { owner, repo, name, description } = await request.json();

  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: "Owner and repo are required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const accessToken = session.access_token as string;
  const userId = session.user.id;
  const repoId = `${owner}/${repo}`;

  // Crear un stream de respuesta
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // 1. Parsear el config.ts
        send({ type: "progress", step: "config", message: "Parseando configuración..." });
        const schemas = await parseContentConfig(accessToken, owner, repo);
        send({ type: "progress", step: "config", completed: true, schemasCount: schemas.length });

        // 2. Listar archivos
        send({ type: "progress", step: "listing", message: "Listando archivos de contenido..." });
        const files = await listContentFiles(accessToken, owner, repo);
        send({ type: "progress", step: "listing", completed: true, filesCount: files.length });

        if (files.length === 0) {
          send({ type: "complete", imported: 0, total: 0 });
          controller.close();
          return;
        }

        // 3. Conectar a MongoDB
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const userCollection = db.collection(getUserCollectionName(userId));

        // 4. Procesar archivos en paralelo con actualizaciones de progreso
        send({ type: "progress", step: "processing", message: "Procesando archivos...", total: files.length });
        
        let completed = 0;
        const errors: string[] = [];

        const processResults = await Promise.all(
          files.map(async (filePath, index) => {
            try {
              const fileData = await getFileContent(accessToken, owner, repo, filePath);

              if (!fileData) {
                completed++;
                send({ type: "progress", step: "processing", completed, total: files.length });
                return { success: false, error: `Could not fetch ${filePath}` };
              }

              const { metadata, content } = parseMarkdown(fileData.content);
              const collectionName = detectCollectionFromPath(filePath);
              const schema = schemas.find((s) => s.name === collectionName) || schemas[0];
              const validationResult = validateAgainstSchema(metadata, schema);

              if (!validationResult.valid) {
                completed++;
                send({ type: "progress", step: "processing", completed, total: files.length });
                return { 
                  success: false, 
                  error: `Invalid metadata in ${filePath}: ${validationResult.errors?.join(", ")}` 
                };
              }

              const result = {
                success: true,
                document: {
                  type: "post",
                  collection: collectionName,
                  sha: fileData.sha,
                  metadata: validationResult.data,
                  content,
                  status: "synced",
                  lastCommitAt: new Date(),
                  updatedAt: new Date(),
                  userId,
                  repoId,
                  filePath,
                  createdAt: new Date(),
                }
              };

              completed++;
              send({ type: "progress", step: "processing", completed, total: files.length });
              
              return result;
            } catch (error) {
              completed++;
              send({ type: "progress", step: "processing", completed, total: files.length });
              console.error(`Error processing ${filePath}:`, error);
              return { success: false, error: `Error processing ${filePath}` };
            }
          })
        );

        const successfulDocs = processResults.filter(r => r.success);
        const failedResults = processResults.filter(r => !r.success);
        errors.push(...failedResults.map(r => (r as any).error!));

        // 5. Guardar en base de datos
        send({ type: "progress", step: "saving", message: "Guardando en base de datos..." });
        
        if (successfulDocs.length > 0) {
          const bulkOps = successfulDocs.map((result: any) => ({
            updateOne: {
              filter: { type: "post", userId, repoId, filePath: result.document.filePath },
              update: {
                $set: {
                  type: result.document.type,
                  collection: result.document.collection,
                  sha: result.document.sha,
                  metadata: result.document.metadata,
                  content: result.document.content,
                  status: result.document.status,
                  lastCommitAt: result.document.lastCommitAt,
                  updatedAt: result.document.updatedAt,
                },
                $setOnInsert: {
                  userId: result.document.userId,
                  repoId: result.document.repoId,
                  filePath: result.document.filePath,
                  createdAt: result.document.createdAt,
                },
              },
              upsert: true,
            },
          }));

          await userCollection.bulkWrite(bulkOps);
        }

        // 6. Guardar schemas
        for (const schema of schemas) {
          await userCollection.updateOne(
            { type: "schema", userId, repoId, collectionName: schema.name },
            {
              $set: {
                type: "schema",
                collectionName: schema.name,
                fields: schema.fields,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                userId,
                repoId,
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );
        }

        // 7. Guardar proyecto
        await userCollection.updateOne(
          { type: "project", userId, repoId },
          {
            $set: {
              type: "project",
              name: name || repo,
              description: description || "",
              postsCount: successfulDocs.length,
              lastSync: new Date(),
              updatedAt: new Date(),
            },
            $setOnInsert: {
              userId,
              repoId,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );

        send({ type: "progress", step: "saving", completed: true });

        // Enviar resultado final
        send({ 
          type: "complete", 
          imported: successfulDocs.length,
          total: files.length,
          errors: errors.length > 0 ? errors : undefined 
        });

        controller.close();
      } catch (error) {
        console.error("Import error:", error);
        send({ type: "error", error: "Failed to import content" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
