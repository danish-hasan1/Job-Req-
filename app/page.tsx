"use client";
import React, { useState } from "react";
import IntakeForm from "@/components/IntakeForm";
import SharingSettingsPanel from "@/components/SharingSettings";
import DocumentCards from "@/components/DocumentCards";
import type { IntakeData, SharingSettings, SharingField } from "@/types";
import { DEFAULT_SHARING_SETTINGS } from "@/types";

const today = new Date().toISOString().split("T")[0];

const DEFAULT_INTAKE: IntakeData = {
  requisitionDate: today,
  createdBy: "",
  requestedBy: "",
  requisitionType: "Internal",
  clientName: "",
  department: "",
  jobTitle: "",
  reportingManager: "",
  reasonForRequirement: "New",
  outgoingEmployeeName: "",
  numberOfResources: 1,
  employmentType: "Permanent",
  contractDurationMonths: 0,
  extensionPossible: "No",
  extensionDurationMonths: 0,
  experienceMin: 0,
  experienceMax: 0,
  budget: "",
  noticePeriod: "30 Days",
  possibleStartDate: "",
  priority: "P1 - High",
  location: "",
  workMode: "Hybrid",
  daysInOffice: 3,
  mandatorySkills: "",
  goodToHaveSkills: "",
  keyResponsibilities: "",
  educationQualification: "",
  certificationsRequired: "",
  numberOfInterviewRounds: 3,
  interviewPanel: "",
  additionalNotes: "",
};

type DocResult = { internal: string | null; vendor: string | null; candidate: string | null; slug: string };

type GenState = "idle" | "generating-all" | "generating-internal" | "generating-vendor" | "generating-candidate";

export default function HomePage() {
  const [showResults, setShowResults] = useState(false);
  const [intake, setIntake] = useState<IntakeData>(DEFAULT_INTAKE);
  const [sharing, setSharing] = useState<SharingSettings>(DEFAULT_SHARING_SETTINGS);
  const [genState, setGenState] = useState<GenState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocResult | null>(null);

  function updateIntake(updates: Partial<IntakeData>) {
    setIntake((prev) => ({ ...prev, ...updates }));
  }

  function updateSharing(key: SharingField, updates: Partial<SharingSettings[SharingField]>) {
    setSharing((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }

  async function generate(docType?: "internal" | "vendor" | "candidate") {
    if (!intake.jobTitle.trim()) {
      setError("Job Title is required before generating documents.");
      return;
    }
    setGenState(docType ? (`generating-${docType}` as GenState) : "generating-all");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeData: intake, sharingSettings: sharing, docType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }
      const data: DocResult = await res.json();

      if (docType) {
        // Merge with existing result — keep other docs if we only regenerated one
        setResult((prev) => ({
          internal: data.internal ?? prev?.internal ?? null,
          vendor: data.vendor ?? prev?.vendor ?? null,
          candidate: data.candidate ?? prev?.candidate ?? null,
          slug: data.slug,
        }));
        setShowResults(true);
      } else {
        setResult(data);
        setShowResults(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate documents.");
    } finally {
      setGenState("idle");
    }
  }

  const loading = genState !== "idle";
  const isGenerating = (t: string) => genState === `generating-${t}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Real logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="LatentBridge" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">Job Requisition Tool</span>
            {showResults && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Documents Generated
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Job Requisition</h1>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the intake form, configure sharing settings, then generate tailored Word documents for each audience.
            </p>
          </div>
          {showResults && (
            <button
              onClick={() => setShowResults(false)}
              className="text-sm text-brand-blue hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Form
            </button>
          )}
        </div>

        {/* Results strip — always visible at top when docs exist */}
        {showResults && result && (
          <DocumentCards
            result={result}
            onReset={() => setShowResults(false)}
            onRegenerate={generate}
            genState={genState}
          />
        )}

        {/* Form */}
        <IntakeForm data={intake} onChange={updateIntake} />

        {/* Sharing Settings — full width below form */}
        <SharingSettingsPanel settings={sharing} intakeData={intake} onChange={updateSharing} />

        {/* Generate buttons */}
        <div className="form-section">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Individual buttons */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Generate individual document</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <GenerateBtn
              label="Internal"
              badge="TA Team Only"
              color="#0E76A8"
              loading={isGenerating("internal")}
              disabled={loading}
              onClick={() => generate("internal")}
            />
            <GenerateBtn
              label="Vendor"
              badge="Partner Brief"
              color="#1E9FD8"
              loading={isGenerating("vendor")}
              disabled={loading}
              onClick={() => generate("vendor")}
            />
            <GenerateBtn
              label="Candidate"
              badge="Job Opportunity"
              color="#2E9E5B"
              loading={isGenerating("candidate")}
              disabled={loading}
              onClick={() => generate("candidate")}
            />
          </div>

          <div className="relative flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Generate all */}
          <button
            onClick={() => generate()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
            style={{ background: loading ? "#1E9FD8" : "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
          >
            {isGenerating("all") || genState === "generating-all" ? (
              <>
                <Spinner />
                Generating All Documents…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate All 3 Documents
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Produces Internal, Vendor &amp; Candidate .docx files simultaneously
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LatentBridge · Workflows to Outcomes · Internal Tool
        </div>
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function GenerateBtn({
  label,
  badge,
  color,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  badge: string;
  color: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
      style={{ borderColor: color, color: color, background: `${color}10` }}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" style={{ color }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <span>{loading ? "Generating…" : `Generate ${label}`}</span>
      <span className="text-[10px] font-normal opacity-60">{badge}</span>
    </button>
  );
}
