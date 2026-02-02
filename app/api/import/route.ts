import { auth } from "@/lib/auth";
import { listContentFiles, getFileContent } from "@/lib/octokit";
import { parseMarkdown } from "@/lib/markdown";
import { PostMetadataSchema } from "@/lib/schemas";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {
  parseContentConfig,
  detectCollectionFromPath,
  validateAgainstSchema,
} from "@/lib/config-parser";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, name, description } = await request.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo are required" },
        { status: 400 }
      );
    }

    const accessToken = session.access_token as string;
    const userId = session.user.id;
    const repoId = `${owner}/${repo}`;

    // 1. Parsear el config.ts para obtener los schemas
    console.log("Parseando config.ts...");
    const schemas = await parseContentConfig(accessToken, owner, repo);
    console.log(`Encontrados ${schemas.length} schemas:`, schemas.map(s => s.name));

    // 2. Listar archivos de contenido
    const files = await listContentFiles(accessToken, owner, repo);

    if (files.length === 0) {
      return NextResponse.json({
        message: "No content files found",
        imported: 0,
      });
    }

    // 2. Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(userId));

    let imported = 0;
    const errors: string[] = [];

    // 3. Procesar cada archivo
    for (const filePath of files) {
      try {
        const fileData = await getFileContent(accessToken, owner, repo, filePath);

        if (!fileData) {
          errors.push(`Could not fetch ${filePath}`);
          continue;
        }

        // 4. Parsear el markdown
        const { metadata, content } = parseMarkdown(fileData.content);

        // 5. Detectar a qué colección pertenece
        const collectionName = detectCollectionFromPath(filePath);
        const schema = schemas.find((s) => s.name === collectionName) || schemas[0];

        // 6. Validar contra el schema de la colección
        const validationResult = validateAgainstSchema(metadata, schema);

        if (!validationResult.valid) {
          errors.push(`Invalid metadata in ${filePath}: ${validationResult.errors?.join(", ")}`);
          continue;
        }

        // 7. Upsert en MongoDB (user collection)
        await userCollection.updateOne(
          { type: "post", userId, repoId, filePath },
          {
            $set: {
              type: "post",
              collection: collectionName,
              sha: fileData.sha,
              metadata: validationResult.data,
              content,
              status: "synced",
              lastCommitAt: new Date(),
              updatedAt: new Date(),
            },
            $setOnInsert: {
              userId,
              repoId,
              filePath,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );

        imported++;
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        errors.push(`Error processing ${filePath}`);
      }
    }

    // 8. Guardar los schemas de las colecciones
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

    // 9. Guardar/actualizar el proyecto en user collection
    await userCollection.updateOne(
      { type: "project", userId, repoId },
      {
        $set: {
          type: "project",
          name: name || repo,
          description: description || "",
          postsCount: imported,
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

    return NextResponse.json({
      message: `Import complete`,
      imported,
      total: files.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import content" },
      { status: 500 }
    );
  }
}
