"use client";
import React from "react";

interface DocResult {
  internal: string | null;
  vendor: string | null;
  candidate: string | null;
  slug: string;
}

type GenState = "idle" | "generating-all" | "generating-internal" | "generating-vendor" | "generating-candidate";

interface Props {
  result: DocResult;
  onReset: () => void;
  onRegenerate: (docType?: "internal" | "vendor" | "candidate") => void;
  genState: GenState;
}

function base64ToBlob(b64: string): Blob {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function downloadDoc(b64: string, filename: string) {
  const blob = base64ToBlob(b64);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface DocCardProps {
  title: string;
  description: string;
  audience: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  b64: string | null;
  filename: string;
  docType: "internal" | "vendor" | "candidate";
  onRegenerate: (docType: "internal" | "vendor" | "candidate") => void;
  isGenerating: boolean;
  anyGenerating: boolean;
}

function DocCard({
  title,
  description,
  audience,
  color,
  bgColor,
  borderColor,
  icon,
  b64,
  filename,
  docType,
  onRegenerate,
  isGenerating,
  anyGenerating,
}: DocCardProps) {
  return (
    <div className={`rounded-xl border-2 ${borderColor} ${bgColor} p-5 flex flex-col gap-3`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div
            className="inline-block text-xs font-bold uppercase tracking-wider rounded-full px-2 py-0.5 mb-1 text-white"
            style={{ background: color }}
          >
            {audience}
          </div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        {b64 ? (
          <button
            onClick={() => downloadDoc(b64, filename)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs text-gray-400 bg-gray-100 border border-dashed border-gray-300">
            Not generated yet
          </div>
        )}
        <button
          onClick={() => onRegenerate(docType)}
          disabled={anyGenerating}
          className="py-2 px-3 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
          style={{ borderColor: color, color: color }}
          title={`Regenerate ${audience} document`}
        >
          {isGenerating ? (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
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
}

export default function DocumentCards({ result, onRegenerate, genState }: Props) {
  const slug = result.slug;
  const anyGenerating = genState !== "idle";
  const allReady = result.internal && result.vendor && result.candidate;

  return (
    <div className="form-section mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Generated Documents</h2>
          <p className="text-xs text-gray-500 mt-0.5">Download individual files or regenerate any single document after editing the form.</p>
        </div>
        {allReady && (
          <button
            onClick={() => {
              if (result.internal) downloadDoc(result.internal, `${slug}_Internal.docx`);
              if (result.vendor) downloadDoc(result.vendor, `${slug}_Vendor.docx`);
              if (result.candidate) downloadDoc(result.candidate, `${slug}_Candidate.docx`);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DocCard
          title="Internal Document"
          description="Full detail for the TA team only — all fields unfiltered."
          audience="Internal"
          color="#0E76A8"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          icon="🔒"
          b64={result.internal}
          filename={`${slug}_Internal.docx`}
          docType="internal"
          onRegenerate={onRegenerate}
          isGenerating={genState === "generating-internal"}
          anyGenerating={anyGenerating}
        />
        <DocCard
          title="Vendor Partner Brief"
          description="Role brief for vendor/sourcing partners — per your sharing settings."
          audience="Vendor"
          color="#1E9FD8"
          bgColor="bg-sky-50"
          borderColor="border-sky-200"
          icon="🤝"
          b64={result.vendor}
          filename={`${slug}_Vendor.docx`}
          docType="vendor"
          onRegenerate={onRegenerate}
          isGenerating={genState === "generating-vendor"}
          anyGenerating={anyGenerating}
        />
        <DocCard
          title="Candidate Job Opportunity"
          description="Candidate-friendly JD — shows only what's appropriate externally."
          audience="Candidate"
          color="#2E9E5B"
          bgColor="bg-green-50"
          borderColor="border-green-200"
          icon="🌟"
          b64={result.candidate}
          filename={`${slug}_Candidate.docx`}
          docType="candidate"
          onRegenerate={onRegenerate}
          isGenerating={genState === "generating-candidate"}
          anyGenerating={anyGenerating}
        />
      </div>
    </div>
  );
}
