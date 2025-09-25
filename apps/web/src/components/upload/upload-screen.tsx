"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  DragEvent,
  HTMLAttributes,
  KeyboardEvent,
} from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
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

  const applyFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) {
        setSelectedFile(null);
        setStatus("idle");
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedFile(file);
      setStatus("idle");
      setErrorMessage(null);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    },
    [preview]
  );

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    applyFile(file ?? null);
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

  const dropZoneRef = useRef<HTMLLabelElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    applyFile(file ?? null);
    setIsDragging(false);
  }

  const dropZoneProps: HTMLAttributes<HTMLLabelElement> = {
    onDragEnter: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
    },
    onDragOver: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    },
    onDragLeave: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!dropZoneRef.current?.contains(event.relatedTarget as Node | null)) {
        setIsDragging(false);
      }
    },
    onDrop: handleDrop,
  };

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onDropZoneKey(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="px-[3.2rem] pt-[4.0rem] text-center">
        <div className="flex flex-col gap-[0.8rem]">
          <h1 className="text-[2.4rem] font-semibold leading-[1.1]">{t("app_title")}</h1>
          <p className="text-[1.2rem] text-foreground/70 leading-[1.6]">{t("app_tagline")}</p>
        </div>
      </header>

      <main
        className="flex-1 px-[3.2rem] pt-[2.8rem]"
        style={{ paddingBottom: "calc(16rem + env(safe-area-inset-bottom))" }}
      >
        <section className="mx-auto flex w-full max-w-[62rem] flex-col gap-[1.6rem] text-center">
          <input
            ref={fileInputRef}
            id="upload-input"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="sr-only"
          />

          <label
            ref={dropZoneRef}
            role="button"
            tabIndex={0}
            aria-label={t("drop_zone_title")}
            htmlFor="upload-input"
            onKeyDown={onDropZoneKey}
            className={`w-full cursor-pointer overflow-hidden rounded-[2.8rem] border border-dashed px-[2.4rem] py-[3.2rem] text-center transition-colors duration-150 ${
              isDragging
                ? "border-foreground/50 bg-foreground/10 text-foreground"
                : "border-foreground/25 bg-background text-foreground/70"
            }`}
            {...dropZoneProps}
          >
            {previewUrl ? (
              <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-[2.4rem] border border-foreground/15 bg-background/70">
                <Image
                  src={previewUrl}
                  alt="Selected preview"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-[1.6rem]">
                <span className="text-[2.2rem]">🖼️</span>
                <div className="space-y-[0.6rem]">
                  <p className="text-[1.3rem] font-medium text-foreground">
                    {t("drop_zone_title")}
                  </p>
                  <p className="text-[1.1rem] text-foreground/70">
                    {t("drop_zone_hint")}
                  </p>
                  <p className="text-[1.0rem] text-foreground/50">
                    {t("supported_formats")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="default"
                  className="w-auto px-[3.2rem]"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openFilePicker();
                  }}
                >
                  {t("upload_button")}
                </Button>
              </div>
            )}
          </label>

          {previewUrl ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => applyFile(null)}
            >
              {t("clear_button")}
            </Button>
          ) : null}

          {previewUrl ? (
            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={handleUpload}
              disabled={status === "uploading"}
            >
              {status === "uploading" ? t("uploading") : t("upload_cta")}
            </Button>
          ) : null}

          <div className="min-h-[2.0rem] text-[1.1rem]">
            {status === "uploading" && <p className="text-foreground/80">{t("uploading")}</p>}
            {status === "success" && <p className="text-green-500">{t("upload_success")}</p>}
            {status === "error" && errorMessage && (
              <p className="text-red-500">{errorMessage}</p>
            )}
            {status === "idle" && errorMessage && (
              <p className="text-foreground/70">{errorMessage}</p>
            )}
          </div>
        </section>

        <section className="mt-[4.0rem] text-center">
          <div className="flex flex-col items-center gap-[0.6rem]">
            <h2 className="text-[1.8rem] font-semibold">{t("recent_uploads")}</h2>
            <span className="text-[1.1rem] text-foreground/50">{uploads.length}</span>
          </div>
          {uploads.length === 0 ? (
            <div className="mt-[2.4rem] rounded-[2.4rem] border border-foreground/10 bg-background/70 p-[3.2rem] text-center">
              <h3 className="text-[1.4rem] font-semibold">{t("empty_state_title")}</h3>
              <p className="mt-[0.8rem] text-[1.2rem] text-foreground/60">
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
                  <div className="mt-[0.8rem] truncate text-[1.0rem] text-foreground/70" title={upload.originalName}>
                    {upload.originalName}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-background/90 backdrop-blur-[1.6rem]">
        <div
          className="mx-auto flex w-full items-center justify-center px-[3.2rem] py-[2.0rem]"
          style={{ paddingBottom: "calc(1.2rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-[1.2rem] text-[1.0rem] text-foreground/70">
            <span className="flex h-[2.8rem] w-[2.8rem] items-center justify-center rounded-full border border-foreground/20 text-[1.1rem] font-semibold">
              H
            </span>
            <span>Home</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
