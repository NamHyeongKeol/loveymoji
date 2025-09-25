import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mime from "mime";
import { prisma } from "@loveymoji/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default ceiling

function resolveExtension(originalName: string, mimeType: string) {
  const extensionFromName = path.extname(originalName).replace(/\./g, "");
  const detectedExtension = mime.getExtension(mimeType);
  return (extensionFromName || detectedExtension || "bin").toLowerCase();
}

function buildPublicUrl(uploadDir: string, fileName: string) {
  const normalizedDir = uploadDir.replace(/^public\/?/, "").replace(/\/$/, "");
  return `/${normalizedDir}/${fileName}`.replace(/\/+/g, "/");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds the 10MB size limit" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name || "upload";
  const extension = resolveExtension(originalName, file.type);

  const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
  const absoluteUploadDir = path.join(process.cwd(), uploadDir);
  await mkdir(absoluteUploadDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const fullPath = path.join(absoluteUploadDir, fileName);
  await writeFile(fullPath, buffer);

  const relativeUrl = buildPublicUrl(uploadDir, fileName);

  const upload = await prisma.upload.create({
    data: {
      originalName,
      mimeType: file.type || mime.getType(extension) || "application/octet-stream",
      size: file.size,
      url: relativeUrl,
    },
  });

  return NextResponse.json({ upload }, { status: 201 });
}
