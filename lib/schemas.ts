import { z } from "zod";

// Schema para transcription blocks
export const TranscriptionBlockSchema = z.object({
  time: z.string(),
  text: z.string(),
});

// Schema para el metadata del post
export const PostMetadataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  tags: z.array(z.string()).optional(),
  episodeUrl: z.string().url().optional(),
  transcription: z.array(TranscriptionBlockSchema).optional(),
  // Agregar más campos según necesidades
});

// Schema completo del post en MongoDB
export const PostSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  repoId: z.string(), // "owner/repo"
  filePath: z.string(),
  sha: z.string(),
  metadata: PostMetadataSchema,
  content: z.string(),
  status: z.enum(["synced", "draft", "modified"]),
  lastCommitAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema para proyectos importados
export const ProjectSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  repoId: z.string(), // "owner/repo"
  name: z.string(),
  description: z.string().optional(),
  postsCount: z.number().default(0),
  lastSync: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TranscriptionBlock = z.infer<typeof TranscriptionBlockSchema>;
export type PostMetadata = z.infer<typeof PostMetadataSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Project = z.infer<typeof ProjectSchema>;
