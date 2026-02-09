
import { S3Client } from "@aws-sdk/client-s3"
import clientPromise, { DB_NAME, getUserCollectionName } from "./mongodb"

export async function getS3Client(userId: string, repoId?: string, forceDefault: boolean = false) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  const userCollection = db.collection(getUserCollectionName(userId))

  let s3Settings = null;

  // 1. If repoId is provided, try to get project-specific settings
  if (repoId && !forceDefault) {
    // Check own projects
    let project = await userCollection.findOne({ type: "project", repoId });
    let settingsUserCollection = userCollection;
    
    // If not found, check shared references
    if (!project) {
      const sharedRef = await userCollection.findOne({ type: "shared_project_reference", repoId });
      if (sharedRef) {
        settingsUserCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
        project = await settingsUserCollection.findOne({ type: "project", repoId });
      }
    }

    if (project && project.s3Config) {
      if (!project.s3Config.useGlobalS3) {
        s3Settings = { ...project.s3Config }; // Clone

        // If repo-specific settings are used, but specifically wanting global credentials
        if (project.s3Config.useGlobalCredentials) {
          const global = await settingsUserCollection.findOne({ type: "settings" });
          if (global) {
            s3Settings.accessKey = global.s3AccessKey;
            s3Settings.secretKey = global.s3SecretKey;
          }
        }
      } else {
        // Use full global settings from the same collection the project was found in
        const globalSettings = await settingsUserCollection.findOne({ type: "settings" });
        if (globalSettings) {
          s3Settings = {
            endpoint: globalSettings.s3Endpoint,
            region: globalSettings.s3Region,
            accessKey: globalSettings.s3AccessKey,
            secretKey: globalSettings.s3SecretKey,
            bucket: globalSettings.s3Bucket,
            publicUrl: globalSettings.s3PublicUrl,
            optimizeImages: globalSettings.s3OptimizeImages,
          };
        }
      }
    } else if (project) {
        // If the project exists but has no specific configuration, try to use the owner's global settings
        // This is critical for shared users to inherit the owner's credentials
        const globalSettings = await settingsUserCollection.findOne({ type: "settings" });
        if (globalSettings) {
          s3Settings = {
            endpoint: globalSettings.s3Endpoint,
            region: globalSettings.s3Region,
            accessKey: globalSettings.s3AccessKey,
            secretKey: globalSettings.s3SecretKey,
            bucket: globalSettings.s3Bucket,
            publicUrl: globalSettings.s3PublicUrl,
            optimizeImages: globalSettings.s3OptimizeImages,
          };
        }
    }
  }

  // 2. Final fallback to current user's global settings (if not already found)
  if (!s3Settings && !forceDefault) {
    const globalSettings = await userCollection.findOne({ type: "settings" });
    if (globalSettings) {
      s3Settings = {
        endpoint: globalSettings.s3Endpoint,
        region: globalSettings.s3Region,
        accessKey: globalSettings.s3AccessKey,
        secretKey: globalSettings.s3SecretKey,
        bucket: globalSettings.s3Bucket,
        publicUrl: globalSettings.s3PublicUrl,
        optimizeImages: globalSettings.s3OptimizeImages,
      };
    }
  }

  let isLimited = false;

  if (!s3Settings || !s3Settings.endpoint || !s3Settings.accessKey || !s3Settings.secretKey || !s3Settings.bucket) {
     // Use Default LIMITED configuration
     s3Settings = {
        endpoint: process.env.DEFAULT_S3_ENDPOINT,
        bucket: "cms-assets",
        publicUrl: "https://cdn-cms.broslunas.com",
        accessKey: process.env.DEFAULT_S3_ACCESS_KEY,
        secretKey: process.env.DEFAULT_S3_SECRET_KEY,
        region: "WEUR"
     };
     isLimited = true;
  }

  const s3Client = new S3Client({
    endpoint: s3Settings.endpoint,
    region: s3Settings.region || "auto",
    credentials: {
      accessKeyId: s3Settings.accessKey,
      secretAccessKey: s3Settings.secretKey,
    },
    forcePathStyle: true,
  });

  return {
    s3Client,
    bucket: s3Settings.bucket,
    publicUrl: s3Settings.publicUrl,
    endpoint: s3Settings.endpoint,
    isLimited,
    optimizeImages: s3Settings.optimizeImages || false
  }
}
