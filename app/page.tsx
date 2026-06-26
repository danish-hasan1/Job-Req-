"use client";
import React, { useState, useRef } from "react";
import IntakeForm from "@/components/IntakeForm";
import SharingSettingsPanel from "@/components/SharingSettings";
import DownloadModal, { type DocResult } from "@/components/DownloadModal";
import SavedReqsPanel from "@/components/SavedReqsPanel";
import type { IntakeData, SharingSettings, SharingField } from "@/types";
import { DEFAULT_SHARING_SETTINGS } from "@/types";
import { saveReq } from "@/lib/savedReqs";

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
  currency: "INR",
  budgetMin: 0,
  budgetMax: 0,
  budgetUnit: "LPA",
  budget: "",
  noticePeriod: "30 Days",
  possibleStartDate: "",
  priority: "P1 - High",
  location: "",
  workMode: "Hybrid",
  daysInOffice: 3,
  aboutRole: "",
  mandatorySkills: "",
  goodToHaveSkills: "",
  keyResponsibilities: "",
  educationQualification: "",
  certificationsRequired: "",
  numberOfInterviewRounds: 3,
  interviewPanel: "",
  additionalNotes: "",
};

type GenState = "idle" | "generating-all" | "generating-internal" | "generating-vendor" | "generating-candidate";

export default function HomePage() {
  const [intake, setIntake] = useState<IntakeData>(DEFAULT_INTAKE);
  const [sharing, setSharing] = useState<SharingSettings>(DEFAULT_SHARING_SETTINGS);
  const [genState, setGenState] = useState<GenState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const generateBtnRef = useRef<HTMLDivElement>(null);

  function updateIntake(updates: Partial<IntakeData>) {
    setIntake((prev) => ({ ...prev, ...updates }));
  }

  function updateSharing(key: SharingField, updates: Partial<SharingSettings[SharingField]>) {
    setSharing((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }

  async function generate(docType?: "internal" | "vendor" | "candidate") {
    if (!intake.jobTitle.trim()) {
      setError("Job Title is required before generating documents.");
      generateBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setGenState(docType ? (`generating-${docType}` as GenState) : "generating-all");
    setError(null);
    // Open modal immediately to show progress
    setModalOpen(true);

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
      setResult((prev) => ({
        internal: data.internal ?? prev?.internal ?? null,
        vendor: data.vendor ?? prev?.vendor ?? null,
        candidate: data.candidate ?? prev?.candidate ?? null,
        slug: data.slug,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate documents.");
      setModalOpen(false);
    } finally {
      setGenState("idle");
    }
  }

  function handleSave() {
    saveReq(intake, sharing);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  }

  function handleLoadReq(loadedIntake: IntakeData, loadedSharing: SharingSettings) {
    setIntake(loadedIntake);
    setSharing(loadedSharing);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const loading = genState !== "idle";
  const hasResult = !!result;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="LatentBridge" className="h-9 w-auto flex-shrink-0" />
            <div className="hidden sm:block h-7 w-px bg-gray-200" />
            <span className="hidden sm:block text-sm font-semibold text-gray-500 truncate">Job Requisition Tool</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Saved reqs button */}
            <button
              onClick={() => setSavedPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Saved Reqs
            </button>

            {/* Downloads floating shortcut — only when docs exist */}
            {hasResult && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Downloads
                <span className="ml-0.5 w-4 h-4 rounded-full bg-white/30 text-[10px] font-bold flex items-center justify-center">
                  {[result?.internal, result?.vendor, result?.candidate].filter(Boolean).length}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Job Requisition</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the intake form and configure sharing settings, then generate tailored Word documents for each audience.
          </p>
        </div>

        {/* Intake form */}
        <IntakeForm data={intake} onChange={updateIntake} />

        {/* Sharing Settings */}
        <SharingSettingsPanel settings={sharing} intakeData={intake} onChange={updateSharing} />

        {/* ── Generate & Save ── */}
        <div ref={generateBtnRef} className="form-section">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Individual buttons */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Generate individual document</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { key: "internal" as const, label: "Internal", badge: "TA Team Only", color: "#0E76A8" },
              { key: "vendor" as const,   label: "Vendor",   badge: "Rate −15%",    color: "#1E9FD8" },
              { key: "candidate" as const,label: "Candidate",badge: "Rate −20%",    color: "#2E9E5B" },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => generate(d.key)}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{ borderColor: d.color, color: d.color, background: `${d.color}10` }}
              >
                {loading && genState === `generating-${d.key}` ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" style={{ color: d.color }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span>{loading && genState === `generating-${d.key}` ? "Generating…" : `Generate ${d.label}`}</span>
                <span className="text-[10px] font-normal opacity-60">{d.badge}</span>
              </button>
            ))}
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
            style={{ background: "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
          >
            {loading && genState === "generating-all" ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
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

          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">save for later</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Save requisition */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 font-medium text-sm hover:border-brand-blue hover:text-brand-blue hover:bg-brand-light/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Requisition
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Saves to this browser · Load later from "Saved Reqs" in the header
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LatentBridge · Workflows to Outcomes · Internal Tool
        </div>
      </footer>

      {/* ── Download Modal (primary UX) ── */}
      <DownloadModal
        open={modalOpen}
        result={result}
        genState={genState}
        onClose={() => setModalOpen(false)}
        onRegenerate={generate}
      />

      {/* ── Floating "Downloads" FAB — visible when modal is closed but docs exist ── */}
      {hasResult && !modalOpen && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-lg text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Downloads Ready
          <span className="w-5 h-5 rounded-full bg-white/25 text-[11px] font-bold flex items-center justify-center">
            {[result?.internal, result?.vendor, result?.candidate].filter(Boolean).length}
          </span>
        </button>
      )}

      {/* ── Saved Reqs Panel ── */}
      <SavedReqsPanel
        open={savedPanelOpen}
        onClose={() => setSavedPanelOpen(false)}
        onLoad={handleLoadReq}
      />

      {/* ── Save toast ── */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Requisition saved! Access it from "Saved Reqs" in the header.
        </div>
      )}
    </div>
  );
}
