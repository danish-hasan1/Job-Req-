"use client";
import React from "react";

export interface DocResult {
  internal: string | null;
  vendor: string | null;
  candidate: string | null;
  slug: string;
}

type GenState = "idle" | "generating-all" | "generating-internal" | "generating-vendor" | "generating-candidate";

interface Props {
  open: boolean;
  result: DocResult | null;
  genState: GenState;
  onClose: () => void;
  onRegenerate: (docType: "internal" | "vendor" | "candidate") => void;
}

function b64ToBlob(b64: string): Blob {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function download(b64: string, filename: string) {
  const url = URL.createObjectURL(b64ToBlob(b64));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const DOC_DEFS = [
  {
    key: "internal" as const,
    label: "Internal",
    subtitle: "TA Team Only — Full Detail",
    icon: "🔒",
    color: "#0E76A8",
    bg: "#EEF6FB",
    border: "#B3D6EA",
  },
  {
    key: "vendor" as const,
    label: "Vendor",
    subtitle: "Partner Brief — Rate −15%",
    icon: "🤝",
    color: "#1E9FD8",
    bg: "#E8F5FC",
    border: "#9DD0EE",
  },
  {
    key: "candidate" as const,
    label: "Candidate",
    subtitle: "Job Opportunity — Rate −20%",
    icon: "🌟",
    color: "#2E9E5B",
    bg: "#EBF7F0",
    border: "#8DD5AA",
  },
];

export default function DownloadModal({ open, result, genState, onClose, onRegenerate }: Props) {
  if (!open) return null;

  const anyGenerating = genState !== "idle";
  const allReady = result?.internal && result?.vendor && result?.candidate;
  const slug = result?.slug || "document";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-start justify-between"
          style={{ background: "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              {anyGenerating ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <h2 className="text-white font-bold text-lg">
                {anyGenerating ? "Generating Documents…" : "Documents Ready"}
              </h2>
            </div>
            <p className="text-white/80 text-sm">
              {anyGenerating
                ? "Please wait while your documents are being prepared."
                : "Your documents are ready. Download individually or all at once."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Doc cards */}
        <div className="p-5 space-y-3">
          {DOC_DEFS.map((def) => {
            const b64 = result?.[def.key] ?? null;
            const isThisGenerating = genState === `generating-${def.key}`;
            return (
              <div
                key={def.key}
                className="rounded-xl border flex items-center gap-4 px-4 py-3"
                style={{ borderColor: def.border, background: def.bg }}
              >
                <span className="text-2xl flex-shrink-0">{def.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{def.label} Document</p>
                  <p className="text-xs text-gray-500">{def.subtitle}</p>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  {/* Download */}
                  {b64 ? (
                    <button
                      onClick={() => download(b64, `${slug}_${def.label}.docx`)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: def.color }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      .docx
                    </button>
                  ) : (
                    <div
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-medium border"
                      style={{ borderColor: def.color, color: def.color, opacity: 0.5 }}
                    >
                      {isThisGenerating ? (
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : "—"}
                    </div>
                  )}
                  {/* Regenerate */}
                  <button
                    onClick={() => onRegenerate(def.key)}
                    disabled={anyGenerating}
                    title={`Regenerate ${def.label}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                    style={{ borderColor: def.color, color: def.color }}
                  >
                    {isThisGenerating ? (
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          {allReady && (
            <button
              onClick={() => {
                DOC_DEFS.forEach((d) => {
                  const b64 = result?.[d.key];
                  if (b64) download(b64, `${slug}_${d.label}.docx`);
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download All 3
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
