import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getS3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get("repoId");
    const folder = searchParams.get("folder") || "";
    const customName = searchParams.get("filename") || "";

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { s3Client, bucket, publicUrl, endpoint } = await getS3Client(session.user.id, repoId || undefined);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop();
    
    // Determine the final filename
    let finalFileName = customName.trim();
    if (!finalFileName) {
        finalFileName = `${uuidv4()}.${fileExtension}`;
    } else {
        // Ensure extension is present if not provided in custom name
        if (!finalFileName.includes(".")) {
            finalFileName = `${finalFileName}.${fileExtension}`;
        }
    }

    // Sanitize and construct the key
    let cleanFolder = folder.trim().replace(/^\/+|\/+$/g, "");
    const fileName = cleanFolder ? `${cleanFolder}/${finalFileName}` : finalFileName;
    
    const contentType = file.type;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);

    // Construct the public URL
    let finalUrl = "";
    if (publicUrl) {
      finalUrl = `${publicUrl.replace(/\/$/, "")}/${fileName}`;
    } else {
      // Fallback to endpoint/bucket/filename logic
      // This varies by provider, but for many S3 compatibles:
      const cleanEndpoint = endpoint.replace(/\/$/, "");
      finalUrl = `${cleanEndpoint}/${bucket}/${fileName}`;
    }

    return NextResponse.json({ 
        url: finalUrl,
        name: file.name,
        size: file.size
    });

  } catch (error: any) {
    console.error("Error uploading file:", error);
    if (error.message === "S3 settings not configured") {
        return NextResponse.json({ error: "Storage not configured. Please go to Settings > Storage." }, { status: 400 });
    }
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
