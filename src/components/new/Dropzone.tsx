"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LIMITS } from "@/lib/config";

export type Upload = { url: string; name: string };

/**
 * Drag, click or paste. Paste matters more than it sounds: most people
 * screenshot a design and hit Cmd+V, and making them save a file first is the
 * difference between a 40-second test and a 4-minute one.
 */
export function Dropzone({
  label,
  value,
  onChange,
  onError,
  active,
}: {
  label: string;
  value: Upload | null;
  onChange: (upload: Upload | null) => void;
  onError: (message: string | null) => void;
  /** Only the focused card listens for paste, so two zones never both take it. */
  active: boolean;
}) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const abort = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: File) => {
      onError(null);

      if (!(LIMITS.UPLOAD_MIME as readonly string[]).includes(file.type)) {
        onError("PNG, JPEG or WEBP only.");
        return;
      }
      if (file.size > LIMITS.UPLOAD_MAX_BYTES) {
        onError("That image is over 6MB. Export it smaller and try again.");
        return;
      }

      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;

      setBusy(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body,
          signal: controller.signal,
        });
        const json = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !json.url) {
          onError(json.error ?? "Upload failed. Try again.");
          return;
        }
        onChange({ url: json.url, name: file.name });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          onError("Upload failed. Check your connection and try again.");
        }
      } finally {
        setBusy(false);
      }
    },
    [onChange, onError],
  );

  useEffect(() => {
    if (!active) return;
    const onPaste = (event: ClipboardEvent) => {
      const item = [...(event.clipboardData?.items ?? [])].find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) {
        event.preventDefault();
        void upload(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [active, upload]);

  if (value) {
    return (
      <div className="overflow-hidden rounded-xl border border-ink bg-paper">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper">
              {label}
            </span>
            <span className="truncate text-[12px] text-muted">{value.name}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] transition-colors hover:bg-sand-deep"
          >
            Replace
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- object URL / demo route; not a static asset */}
        <img
          src={value.url}
          alt={`Version ${label} preview`}
          className="block max-h-[280px] w-full bg-sand object-contain"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) void upload(file);
      }}
      className={`relative flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-10 text-center transition-colors ${
        over ? "border-ink bg-sand-deep" : "border-line bg-sand hover:border-faint"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-[12px] font-semibold">
        {label}
      </span>

      {busy ? (
        <>
          <div className="skeleton mt-4 h-2 w-28 rounded-full" />
          <p className="mt-3 text-[13px] text-muted">Uploading…</p>
        </>
      ) : (
        <>
          <p className="mt-4 text-[14px] font-medium">Drop version {label} here</p>
          <p className="mt-1 text-[13px] text-muted">
            or{" "}
            <label
              htmlFor={inputId}
              className="cursor-pointer text-ink underline underline-offset-2"
            >
              choose a file
            </label>
            {active && <span className="hidden sm:inline"> · or just paste</span>}
          </p>
          <p className="mt-3 text-[11px] text-faint">PNG, JPEG or WEBP · up to 6MB</p>
        </>
      )}

      <input
        id={inputId}
        type="file"
        accept={LIMITS.UPLOAD_MIME.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
