
import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise, { DB_NAME } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error("GITHUB_WEBHOOK_SECRET is not defined");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");
    const id = req.headers.get("x-github-delivery");

    if (!signature || !event || !id) {
       return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const body = await req.text();

    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(body).digest("hex");

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);

    console.log(`[Webhook] Received event: ${event} (ID: ${id})`);

    // Handle specific logic based on event type
    switch (event) {
        case "push":
            await handlePushEvent(payload);
            break;
        case "installation":
            await handleInstallationEvent(payload);
            break;
        case "ping":
            console.log("Ping received");
            break;
        default:
            console.log(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handlePushEvent(payload: any) {
    const repoId = payload.repository.full_name; // "owner/repo"
    const branch = payload.ref.replace("refs/heads/", "");
    
    // Logic to sync or invalidate cache for this repo
    // For now, just logging
    console.log(`Push to ${repoId} on branch ${branch}`);
    
    // Changes
    const commits = payload.commits || [];
    const added = commits.flatMap((c:any) => c.added);
    const modified = commits.flatMap((c:any) => c.modified);
    const removed = commits.flatMap((c:any) => c.removed);
    
    console.log(`Changes: +${added.length} ~${modified.length} -${removed.length}`);

    // Here we can call the sync logic if we had it exposed as a function
    // await syncRepo(repoId);
}

async function handleInstallationEvent(payload: any) {
    const action = payload.action; // "created", "deleted", "suspend", "unsuspend"
    const installationId = payload.installation.id;
    const account = payload.installation.account.login;

    console.log(`Installation ${action} for ${account} (ID: ${installationId})`);
    
    // Update DB implementation here if needed
}
