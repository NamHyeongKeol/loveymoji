"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Upload } from "@loveymoji/db";

type Status = "idle" | "uploading" | "success" | "error";

export function UploadScreen({ initialUploads }: { initialUploads: Upload[] }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const utils = trpc.useUtils();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadsQuery = trpc.upload.all.useQuery(undefined, {
    initialData: initialUploads,
  });

  const uploads = uploadsQuery.data ?? [];

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return preview;
  }, [selectedFile, preview]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(file);
    setStatus("idle");
    setErrorMessage(null);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage(t("select_file_warning"));
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload === "object" && payload && "error" in payload
            ? String(payload.error)
            : t("upload_error");
        throw new Error(message);
      }

      await utils.upload.all.invalidate();
      setStatus("success");
      setSelectedFile(null);
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : t("upload_error"));
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="px-[3.2rem] pt-[4.0rem]">
        <div className="flex flex-col gap-[0.8rem]">
          <h1 className="text-[2.8rem] font-semibold leading-[1.1]">{t("app_title")}</h1>
          <p className="text-[1.4rem] text-foreground/70 leading-[1.5]">{t("app_tagline")}</p>
        </div>
      </header>

      <main className="flex-1 px-[3.2rem] pt-[3.2rem] pb-[12rem]">
        <section className="rounded-[2.4rem] border border-foreground/10 bg-foreground/[0.03] p-[3.2rem] backdrop-blur-[1.2rem] shadow-[0_1.2rem_3.2rem_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-[2.4rem]">
                <div className="flex flex-col gap-[1.2rem]">
                  <label className="text-[1.2rem] uppercase tracking-[0.2rem] text-foreground/60">
                    {t("upload_button")}
                  </label>
                  <div className="flex items-center gap-[1.2rem]">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t("upload_button")}
                    </Button>
                  </div>
                </div>

                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-[2.0rem] border border-foreground/10">
                    <Image
                      src={previewUrl}
                      alt="Selected preview"
                      width={800}
                      height={800}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[18rem] items-center justify-center rounded-[2.0rem] border border-dashed border-foreground/20 bg-background/60 text-[1.3rem] text-foreground/50">
                    <p>{t("supported_formats")}</p>
                  </div>
                )}

                <div className="min-h-[2.0rem] text-[1.3rem]">
                  {status === "uploading" && <p className="text-foreground/80">{t("uploading")}</p>}
                  {status === "success" && <p className="text-green-600">{t("upload_success")}</p>}
                  {status === "error" && errorMessage && (
                    <p className="text-red-500">{errorMessage}</p>
                  )}
                  {status === "idle" && errorMessage && (
                    <p className="text-foreground/70">{errorMessage}</p>
                  )}
                </div>
          </div>
        </section>

        <section className="mt-[4.0rem]">
          <div className="flex items-center justify-between">
            <h2 className="text-[2.0rem] font-semibold">{t("recent_uploads")}</h2>
            <span className="text-[1.2rem] text-foreground/50">{uploads.length}</span>
          </div>
          {uploads.length === 0 ? (
            <div className="mt-[2.4rem] rounded-[2.4rem] border border-foreground/10 bg-background/70 p-[3.2rem] text-center">
              <h3 className="text-[1.6rem] font-semibold">{t("empty_state_title")}</h3>
              <p className="mt-[0.8rem] text-[1.3rem] text-foreground/60">
                {t("empty_state_description")}
              </p>
            </div>
          ) : (
            <div className="mt-[2.4rem] grid grid-cols-2 gap-[1.6rem]">
              {uploads.map((upload) => (
                <article
                  key={upload.id}
                  className="rounded-[1.6rem] border border-foreground/8 bg-background/80 p-[0.8rem] shadow-[0_0.8rem_1.2rem_rgba(0,0,0,0.06)] backdrop-blur-[0.8rem]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[1.2rem]">
                    <Image
                      src={upload.url}
                      alt={upload.originalName}
                      fill
                      sizes="50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-[0.8rem] truncate text-[1.1rem] text-foreground/70" title={upload.originalName}>
                    {upload.originalName}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-background/80 backdrop-blur-[2.0rem]">
        <div
          className="mx-auto flex w-full max-w-[64rem] items-center justify-between gap-[1.6rem] px-[3.2rem] py-[2.4rem]"
          style={{ paddingBottom: "calc(2.4rem + env(safe-area-inset-bottom))" }}
        >
          <div className="truncate pr-[1.6rem] text-[1.2rem] text-foreground/70">
            {selectedFile ? selectedFile.name : t("upload_button")}
          </div>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={handleUpload}
            disabled={status === "uploading" || !selectedFile}
          >
            {status === "uploading" ? t("uploading") : t("upload_cta")}
          </Button>
        </div>
      </nav>
    </div>
  );
}
