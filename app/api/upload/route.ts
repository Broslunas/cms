import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getS3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

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
    const useDefault = searchParams.get("useDefault") === "true";

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { s3Client, bucket, publicUrl, endpoint, isLimited } = await getS3Client(session.user.id, repoId || undefined, useDefault);

    let buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;
    let fileExtension = file.name.split(".").pop();
    let originalName = file.name;

    if (isLimited) {
        if (!contentType.startsWith("image/")) {
            return NextResponse.json({ error: "Free storage only supports images." }, { status: 400 });
        }

        // Process with Sharp
        try {
            let image = sharp(buffer);
            const metadata = await image.metadata();
            
            // Resize if too large (max 1920x1920) to help reduce size
            if ((metadata.width || 0) > 1920 || (metadata.height || 0) > 1920) {
                image = image.resize({
                    width: 1920, 
                    height: 1920, 
                    fit: 'inside', 
                    withoutEnlargement: true 
                });
            }

            // Initial conversion attempt
            let outputBuffer = await image.webp({ quality: 80 }).toBuffer();
            
            // If still too large, try reducing quality
            if (outputBuffer.byteLength > 300 * 1024) {
                 outputBuffer = await image.webp({ quality: 60 }).toBuffer();
            }

            // If STILL too large, try aggressive reduction
            if (outputBuffer.byteLength > 300 * 1024) {
                 outputBuffer = await image.resize({ width: 1280, height: 1280, fit: 'inside' })
                                           .webp({ quality: 50 }).toBuffer();
            }

            // Final check
            if (outputBuffer.byteLength > 300 * 1024) {
                return NextResponse.json({ error: "Image could not be compressed to under 300KB. Please upload a smaller image." }, { status: 400 });
            }

            buffer = outputBuffer as any;
            contentType = "image/webp";
            fileExtension = "webp";
            
            // Update original name to reflect webp
            const nameParts = originalName.split(".");
            if (nameParts.length > 1) {
                nameParts.pop();
            }
            originalName = nameParts.join(".") + ".webp";

        } catch (e) {
            console.error("Image processing failed:", e);
            return NextResponse.json({ error: "Image processing failed." }, { status: 500 });
        }
    }

    
    let finalFileName = customName.trim();
    
    if (isLimited) {
        // Force random name and ignore folder for limited users
        finalFileName = `${uuidv4()}.webp`;
    } else {
        if (!finalFileName) {
            finalFileName = `${uuidv4()}.${fileExtension}`;
        } else {
            // Ensure extension is present if not provided in custom name
            if (!finalFileName.includes(".")) {
                 finalFileName = `${finalFileName}.${fileExtension}`;
            }
        }
    }

    // Sanitize and construct the key
    let cleanFolder = folder.trim().replace(/^\/+|\/+$/g, "");
    
    // Force root folder for limited users
    if (isLimited) {
        cleanFolder = "";
    }

    const fileName = cleanFolder ? `${cleanFolder}/${finalFileName}` : finalFileName;
    
    // Check if filename already exists? S3 overwrites by default which is usually what we want or we rely on UUIDs.
    // However, if using custom names, overwrite is dangerous?
    // The current logic seems to allow overwrite. I won't change that behavior unless asked.

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
      const cleanEndpoint = endpoint.replace(/\/$/, "");
      finalUrl = `${cleanEndpoint}/${bucket}/${fileName}`;
    }

    return NextResponse.json({ 
        url: finalUrl,
        name: originalName,
        size: buffer.byteLength
    });

  } catch (error: any) {
    console.error("Error uploading file:", error);
    if (error.message === "S3 settings not configured") {
        return NextResponse.json({ error: "Storage not configured. Please go to Settings > Storage." }, { status: 400 });
    }
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
