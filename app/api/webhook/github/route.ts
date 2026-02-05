
import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { syncFiles, deleteFiles } from "@/lib/sync-utils";

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
    const [owner, repo] = repoId.split('/');
    const branch = payload.ref.replace("refs/heads/", "");
    
    // Check if this is the default branch (usually main or master)
    // We only want to sync the main branch usually, OR we need logic to handle branches depending on user config.
    // Ideally, we check payload.repository.default_branch
    const defaultBranch = payload.repository.default_branch;
    if (branch !== defaultBranch) {
        console.log(`[Webhook] Ignoring push to non-default branch ${branch} (default: ${defaultBranch})`);
        return;
    }

    // Identify the USER who owns this repo in our CMS.
    // Since this is a webhook, we don't have a session.
    // We need to look up which user has installed this app/repo.
    // IMPORTANT: A repo could be installed by multiple users if it's an Organization repo they both belong to,
    // OR normally in our simple CMS, one user links a repo.
    // Logic: Find user who has a "project" document with this repoId.
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // We need to find "a collection that contains a project with repoId"
    // Since names are dynamic "users_{id}", we perform a lookup on our "users" collection (if we had one) or 
    // we have to iterate collections? NO, that's bad.
    // Better: We should store a global "installations" map or search efficiently.
    // HACK for MVP: We assume we iterate/search or we have a `installations` collection.
    // To keep it simple without migration:
    // When a user imports a project, we should maybe store a mapping { repoId: userId } in a central `repos` collection
    // BUT since we don't have that yet, let's look for the user associated with the `installation.id` if provided.
    
    // The payload includes `installation` object.
    const installationId = payload.installation?.id;
    if (!installationId) {
        console.error("[Webhook] No installation ID in push event");
        return;
    }

    // Find the user who owns this installation
    // We need a way to map installationId -> userId.
    // The `users` collection (NextAuth) usually stores accounts.
    // Let's assume we store the token or installation ID somewhere?
    // Actually we don't strictly save installationId in the User object yet.
    // FIXME: We need to find the user.
    // STRATEGY: Find any collection "users_..." that has a project with this repoId.
    // Since we can't scan all collections easily in Mongo without privileges or huge performance hit...
    // We will Create a "repo_map" collection or iterate.
    
    // For now, let's try to query the `accounts` collection from NextAuth if it exists?
    // No, let's use a simpler approach: 
    // We will assume "owner" of the repo matches the GitHub username of one of our users logic? No.
    
    // CORRECT FIX: When importing a repo, save a document in a central `installations` collection.
    // Since we can't change Import flow right now without breaking context:
    // Let's search in the `users` collection if we stored the github profile? 
    // Or just look for the user who has `accounts.providerAccountId` == payload.sender.id?
    // No, the pusher might not be the dashboard owner.
    
    // SEARCH: We will rely on a new `db.collection("repo_index")` that we should maintain.
    // If it doesn't exist, we can't sync.
    // Fallback: We can't implement full sync without knowing the Target User.
    // TEMPORARY SOLUTION:
    // Search the `users` collection to find the user with `email` matching the committer? Unreliable.
    
    // Let's implement a `repo_index` lookup on the fly.
    // We'll update the Import function later to populate this.
    // For now, we will query all `users_...` collections? No.
    
    // Wait, we have `getUserCollectionName(userId)`. 
    // We can query the `users` (NextAuth users) and Loop? (Bad for scale, ok for MVP)
    // Or we require the User to have `installation_id` saved.

    // Let's try to find the project by searching for a uniquely indexed field if possible.
    // PROPOSAL: We will create a `repo_mappings` collection on the fly when logic runs if needed, 
    // but for now, we'll try to find the user by their GitHub ID (if they logged in via GitHub).
    // The `installation.account.id` is the owner of the repo (User or Org).
    // If it's a User account, we can find our User with `providerAccountId === installation.account.id`.
    
    const accountId = String(payload.repository.owner.id);
    
    // Find user in NextAuth `accounts` collection
    const account = await db.collection("accounts").findOne({ 
        provider: "github", 
        providerAccountId: accountId 
    });

    if (!account) {
        console.warn(`[Webhook] No CMS user found for GitHub Owner ID ${accountId}`);
        // If it's an Organization, we'd need to check who installed it.
        // For now, only supports Personal Account repos matching the auth user.
        return;
    }

    const userId = account.userId;
    // We need the assessToken to fetch Content if the repo is private.
    // The `account` document usually has `access_token`!
    // (NextAuth saves it if configured)
    const accessToken = account.access_token;

    if (!userId || !accessToken) {
        console.error("[Webhook] User or Access Token missing for sync");
        return;
    }

    console.log(`[Webhook] Identified CMS User: ${userId}`);

    // Get modified files
    const commits = payload.commits || [];
    const added = commits.flatMap((c:any) => c.added);
    const modified = commits.flatMap((c:any) => c.modified);
    const removed = commits.flatMap((c:any) => c.removed);

    const changedFiles = [...new Set([...added, ...modified])];
    const removedFiles = [...new Set([...removed])];

    if (changedFiles.length > 0) {
        await syncFiles(accessToken, userId.toString(), owner, repo, changedFiles);
    }

    if (removedFiles.length > 0) {
        await deleteFiles(userId.toString(), owner, repo, removedFiles);
    }
}

async function handleInstallationEvent(payload: any) {
    const action = payload.action; // "created", "deleted", "suspend", "unsuspend"
    const installationId = payload.installation.id;
    const account = payload.installation.account.login;

    console.log(`Installation ${action} for ${account} (ID: ${installationId})`);
    
    // Update DB implementation here if needed
}
