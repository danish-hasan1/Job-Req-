"use client";
import React from "react";

interface DocResult {
  internal: string; // base64
  vendor: string;
  candidate: string;
  slug: string;
}

interface Props {
  result: DocResult;
  onReset: () => void;
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
  b64: string;
  filename: string;
}

function DocCard({ title, description, audience, color, bgColor, borderColor, icon, b64, filename }: DocCardProps) {
  return (
    <div className={`rounded-xl border-2 ${borderColor} ${bgColor} p-6 flex flex-col gap-4`}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: color, opacity: 0.15 }}
        />
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 -ml-16 relative z-10"
          style={{ background: "transparent" }}
        >
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="inline-block text-xs font-bold uppercase tracking-wider rounded-full px-2 py-0.5 mb-1 text-white"
            style={{ background: color }}
          >
            {audience}
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        </div>
      </div>

      <button
        onClick={() => downloadDoc(b64, filename)}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
        style={{ background: color }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download {filename}
      </button>
    </div>
  );
}

export default function DocumentCards({ result, onReset }: Props) {
  const slug = result.slug;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documents Ready</h2>
          <p className="text-sm text-gray-500 mt-0.5">All three documents have been generated. Click to download each.</p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-brand-blue hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Edit & Regenerate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocCard
          title="Internal Document"
          description="Full detail for the TA team — all fields, unfiltered. Not for external distribution."
          audience="Internal"
          color="#0E76A8"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          icon="🔒"
          b64={result.internal}
          filename={`${slug}_Internal.docx`}
        />
        <DocCard
          title="Vendor Partner Brief"
          description="Role brief for vendor/sourcing partners. Sensitive fields hidden or anonymised per your settings."
          audience="Vendor"
          color="#1E9FD8"
          bgColor="bg-sky-50"
          borderColor="border-sky-200"
          icon="🤝"
          b64={result.vendor}
          filename={`${slug}_Vendor.docx`}
        />
        <DocCard
          title="Candidate Job Opportunity"
          description="Candidate-friendly job description. Shows only what's appropriate for external candidates."
          audience="Candidate"
          color="#2E9E5B"
          bgColor="bg-green-50"
          borderColor="border-green-200"
          icon="🌟"
          b64={result.candidate}
          filename={`${slug}_Candidate.docx`}
        />
      </div>

      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={() => {
            downloadDoc(result.internal, `${slug}_Internal.docx`);
            downloadDoc(result.vendor, `${slug}_Vendor.docx`);
            downloadDoc(result.candidate, `${slug}_Candidate.docx`);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-dark text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download All Three
        </button>
      </div>
    </div>
  );
}
