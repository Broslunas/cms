
import { auth } from "@/lib/auth";
import { parseMarkdown } from "@/lib/markdown";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { getFileContent } from "@/lib/octokit";
import {
    detectCollectionFromPath,
    validateAgainstSchema,
    parseContentConfig
  } from "@/lib/config-parser";


/**
 * Synchronizes list of files from GitHub to MongoDB for a specific user
 * This function is designed to be called from background jobs or webhooks
 */
export async function syncFiles(
    accessToken: string,
    userId: string,
    owner: string, 
    repo: string, 
    files: string[]
) {
    const repoId = `${owner}/${repo}`;
    console.log(`[Sync] Syncing ${files.length} files for ${repoId}`);

    // Fetch config first to have schemas ready (cache this optimization later)
    let schemas: any[] = [];
    try {
        schemas = await parseContentConfig(accessToken, owner, repo);
    } catch(e) {
        console.warn("[Sync] Failed to parse config, using fallback logic");
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(userId));

    // Process files
    // For webhooks, list usually contains distinct files.
    // We filter only relevant content files (.md, .mdx)
    const contentFiles = files.filter(f => 
        (f.endsWith(".md") || f.endsWith(".mdx")) && !f.includes("node_modules")
    );

    if (contentFiles.length === 0) return { synced: 0 };

    let syncedCount = 0;

    // Process concurrently
    await Promise.all(contentFiles.map(async (filePath) => {
        try {
            // 1. Fetch latest content from GitHub
            // Note: We might want to pass 'ref' if we want specific branch often 'main'/'master'
            const fileData = await getFileContent(accessToken, owner, repo, filePath);

            if (!fileData) {
                console.warn(`[Sync] File ${filePath} not found (maybe deleted?)`);
                // Handle deletion logic here if needed:
                // await userCollection.deleteOne({ type: "post", repoId, filePath });
                return;
            }

            // 2. Parse Content
            const { metadata, content } = parseMarkdown(fileData.content);

            // 3. Detect Collection & Validate
            const collectionName = detectCollectionFromPath(filePath);
            const schema = schemas.find((s) => s.name === collectionName);
            
            // Only validate if schema exists, otherwise save 'raw' (or use default validation)
            let finalMetadata = metadata;
            if (schema) {
                const validation = validateAgainstSchema(metadata, schema);
                if (validation.valid) {
                    finalMetadata = validation.data;
                } else {
                    console.warn(`[Sync] Invalid metadata for ${filePath}`, validation.errors);
                    // We might still save it but mark as 'invalid_schema' or similar?
                    // For now, save anyway to keep in sync
                }
            }

            // 4. Update DB
            await userCollection.updateOne(
                { type: "post", repoId, filePath },
                {
                    $set: {
                        type: "post",
                        collection: collectionName,
                        sha: fileData.sha,
                        metadata: finalMetadata,
                        content: content,
                        status: "synced", // It comes from GitHub, so it is synced
                        lastCommitAt: new Date(),
                        updatedAt: new Date(),
                        // Ensure these fields exist on insert
                    },
                    $setOnInsert: {
                        userId,
                        repoId,
                        filePath,
                        createdAt: new Date(),
                    }
                },
                { upsert: true }
            );

            syncedCount++;

        } catch (error) {
            console.error(`[Sync] Error syncing file ${filePath}:`, error);
        }
    }));

    // Update project last sync date
    if (syncedCount > 0) {
        await userCollection.updateOne(
            { type: "project", repoId },
            { 
                $set: { lastSync: new Date(), updatedAt: new Date() },
                $inc: { postsCount: 0 } // Re-count usually better, but expensive. 
            }
        );
    }

    return { synced: syncedCount };
}


/**
 * Handles deletion of files
 */
export async function deleteFiles(
    userId: string,
    owner: string,
    repo: string,
    files: string[]
) {
    const repoId = `${owner}/${repo}`;
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(userId));

    await userCollection.deleteMany({
        type: "post",
        repoId,
        filePath: { $in: files }
    });

    console.log(`[Sync] Deleted ${files.length} files from DB for ${repoId}`);
}
