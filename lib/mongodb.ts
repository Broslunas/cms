import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usar una variable global para mantener la conexión
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En producción, crear una nueva conexión
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

/**
 * Database name
 */
export const DB_NAME = "broslunas-cms";

/**
 * Get user collection name
 * Each user has their own collection to isolate data
 */
export function getUserCollectionName(userId: string): string {
  // Sanitize userId to be a valid collection name
  const sanitized = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  return `user_${sanitized}`;
}
