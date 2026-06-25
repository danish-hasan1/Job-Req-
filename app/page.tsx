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

type Step = "form" | "done";

export default function HomePage() {
  const [step, setStep] = useState<Step>("form");
  const [intake, setIntake] = useState<IntakeData>(DEFAULT_INTAKE);
  const [sharing, setSharing] = useState<SharingSettings>(DEFAULT_SHARING_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ internal: string; vendor: string; candidate: string; slug: string } | null>(null);

  function updateIntake(updates: Partial<IntakeData>) {
    setIntake((prev) => ({ ...prev, ...updates }));
  }

  function updateSharing(key: SharingField, updates: Partial<SharingSettings[SharingField]>) {
    setSharing((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  }

  async function handleGenerate() {
    if (!intake.jobTitle.trim()) {
      setError("Job Title is required before generating documents.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeData: intake, sharingSettings: sharing }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate documents.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo wordmark */}
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold" style={{ color: "#1E9FD8" }}>
                Latent<span style={{ color: "#0E76A8" }}>Bridge</span>
              </span>
              <span className="text-[10px] italic text-gray-400 tracking-wide">Workflows to Outcomes</span>
            </div>
            <div className="h-8 w-px bg-gray-200 mx-1" />
            <span className="text-sm font-semibold text-gray-700">Job Requisition Tool</span>
          </div>
          {step === "done" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Documents Generated
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === "done" && result ? (
          <DocumentCards result={result} onReset={() => setStep("form")} />
        ) : (
          <>
            {/* Page title */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">New Job Requisition</h1>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the intake form and configure sharing settings, then generate three tailored Word documents in one click.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* Left: form */}
              <div>
                <IntakeForm data={intake} onChange={updateIntake} />
              </div>

              {/* Right: sharing settings + generate */}
              <div className="lg:sticky lg:top-20">
                <SharingSettingsPanel
                  settings={sharing}
                  intakeData={intake}
                  onChange={updateSharing}
                />

                {/* Generate button */}
                <div className="form-section mt-0">
                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
                    style={{ background: loading ? "#1E9FD8" : "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating Documents…
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
                    Produces Internal, Vendor, and Candidate .docx files
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LatentBridge · Workflows to Outcomes · Internal Tool
        </div>
      </footer>
    </div>
  );
}
