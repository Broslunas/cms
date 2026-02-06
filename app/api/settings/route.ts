
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    const settings = await userCollection.findOne({ type: "settings" });

    if (!settings) {
        return NextResponse.json({ 
            vercelGlobalToken: null 
        });
    }

    // Don't expose the full token if we can avoid it, but for now we might need it for "Global saved token ...XXX"
    // Actually, we can return the full token if the user is authenticated, 
    // but maybe masking it is better for UI if we don't want to show it.
    // For this API, returning it is fine as it is an authenticated route for the user.
    return NextResponse.json({
        vercelGlobalToken: settings.vercelGlobalToken || null,
        s3Endpoint: settings.s3Endpoint || null,
        s3Region: settings.s3Region || null,
        s3AccessKey: settings.s3AccessKey || null,
        s3SecretKey: settings.s3SecretKey || null,
        s3Bucket: settings.s3Bucket || null,
        s3PublicUrl: settings.s3PublicUrl || null,
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
        vercelGlobalToken,
        s3Endpoint,
        s3Region,
        s3AccessKey,
        s3SecretKey,
        s3Bucket,
        s3PublicUrl
    } = await req.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    const update: any = {};
    if (vercelGlobalToken !== undefined) update.vercelGlobalToken = vercelGlobalToken;
    if (s3Endpoint !== undefined) update.s3Endpoint = s3Endpoint;
    if (s3Region !== undefined) update.s3Region = s3Region;
    if (s3AccessKey !== undefined) update.s3AccessKey = s3AccessKey;
    if (s3SecretKey !== undefined) update.s3SecretKey = s3SecretKey;
    if (s3Bucket !== undefined) update.s3Bucket = s3Bucket;
    if (s3PublicUrl !== undefined) update.s3PublicUrl = s3PublicUrl;

    await userCollection.updateOne(
        { type: "settings" },
        { $set: update },
        { upsert: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
