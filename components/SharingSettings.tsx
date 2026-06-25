"use client";
import React, { useState } from "react";
import type { SharingSettings, SharingField, IntakeData } from "@/types";
import { SHARING_FIELDS_ORDER, SHARING_FIELD_LABELS } from "@/types";

interface Props {
  settings: SharingSettings;
  intakeData: IntakeData;
  onChange: (key: SharingField, updates: Partial<SharingSettings[SharingField]>) => void;
}

function Toggle({
  checked,
  onChange,
  label,
  color,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color: "blue" | "green";
}) {
  const bg = checked
    ? color === "blue"
      ? "bg-brand-blue"
      : "bg-brand-green"
    : "bg-gray-300";
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        color === "blue" ? "focus:ring-brand-blue" : "focus:ring-brand-green"
      } ${bg}`}
      role="switch"
      aria-checked={checked}
      title={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SharingSettingsPanel({ settings, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="form-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brand-dark text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            S
          </div>
          <h2 className="text-base font-semibold text-brand-dark">Sharing Settings</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-brand-blue hover:underline"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Control what each audience sees. Toggle off to hide a field. Add an override to replace the real value with display text
            (e.g. "A Leading Private Bank (Confidential)").
          </p>

          {/* Header row */}
          <div className="grid grid-cols-[200px_1fr_1fr] gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-3">
            <span>Field</span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#1E9FD8" }} />
              Vendor Doc
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#2E9E5B" }} />
              Candidate Doc
            </span>
          </div>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
            {SHARING_FIELDS_ORDER.map((key) => {
              const cfg = settings[key];
              const label = SHARING_FIELD_LABELS[key];
              return (
                <div key={key} className="grid grid-cols-[200px_1fr_1fr] gap-2 items-start p-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-700 pt-1">{label}</span>

                  {/* Vendor column */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={cfg.vendorInclude}
                        onChange={(v) => onChange(key, { vendorInclude: v })}
                        label={`Include ${label} in Vendor doc`}
                        color="blue"
                      />
                      <span className={`text-xs ${cfg.vendorInclude ? "text-brand-blue font-medium" : "text-gray-400"}`}>
                        {cfg.vendorInclude ? "Include" : "Hide"}
                      </span>
                    </div>
                    {cfg.vendorInclude && (
                      <input
                        type="text"
                        placeholder="Override display value (optional)"
                        value={cfg.vendorOverride}
                        onChange={(e) => onChange(key, { vendorOverride: e.target.value })}
                        className="text-xs py-1 px-2 border border-gray-200 rounded-md w-full focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Candidate column */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={cfg.candidateInclude}
                        onChange={(v) => onChange(key, { candidateInclude: v })}
                        label={`Include ${label} in Candidate doc`}
                        color="green"
                      />
                      <span className={`text-xs ${cfg.candidateInclude ? "text-brand-green font-medium" : "text-gray-400"}`}>
                        {cfg.candidateInclude ? "Include" : "Hide"}
                      </span>
                    </div>
                    {cfg.candidateInclude && (
                      <input
                        type="text"
                        placeholder="Override display value (optional)"
                        value={cfg.candidateOverride}
                        onChange={(e) => onChange(key, { candidateOverride: e.target.value })}
                        className="text-xs py-1 px-2 border border-gray-200 rounded-md w-full focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
