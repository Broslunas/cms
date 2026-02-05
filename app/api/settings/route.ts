
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
        // Add other global settings here
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

    const { vercelGlobalToken } = await req.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    const update: any = {};
    if (vercelGlobalToken !== undefined) {
        update.vercelGlobalToken = vercelGlobalToken;
    }

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
