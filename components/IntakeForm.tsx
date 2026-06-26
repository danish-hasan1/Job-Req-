"use client";
import React from "react";
import type { IntakeData } from "@/types";
import { CURRENCIES, BUDGET_UNITS } from "@/types";

interface Props {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field-label">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? "mb-4"}>{children}</div>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function SectionTitle({ num, title }: { num: number | string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-brand-light">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">
        {num}
      </span>
      <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
    </div>
  );
}

export default function IntakeForm({ data, onChange }: Props) {
  const set = <K extends keyof IntakeData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
      onChange({ [key]: val } as Partial<IntakeData>);
    };

  return (
    <div>
      {/* Section 1 */}
      <div className="form-section">
        <SectionTitle num={1} title="Requisition Details" />
        <Grid>
          <Field>
            <Label>Requisition Date</Label>
            <input type="date" value={data.requisitionDate} onChange={set("requisitionDate")} />
          </Field>
          <Field>
            <Label>Created By</Label>
            <input type="text" placeholder="Your name" value={data.createdBy} onChange={set("createdBy")} />
          </Field>
          <Field>
            <Label>Requested By</Label>
            <input type="text" placeholder="Stakeholder name" value={data.requestedBy} onChange={set("requestedBy")} />
          </Field>
          <Field>
            <Label>Requisition Type</Label>
            <select value={data.requisitionType} onChange={set("requisitionType")}>
              <option value="Internal">Internal</option>
              <option value="Client">Client</option>
            </select>
          </Field>
          {data.requisitionType === "Client" && (
            <Field>
              <Label required>Client Name</Label>
              <input type="text" placeholder="Client company name" value={data.clientName} onChange={set("clientName")} />
            </Field>
          )}
          <Field>
            <Label>Department</Label>
            <input type="text" placeholder="e.g. Engineering, Finance" value={data.department} onChange={set("department")} />
          </Field>
          <Field>
            <Label required>Job Title / Position</Label>
            <input type="text" placeholder="e.g. Senior Data Engineer" value={data.jobTitle} onChange={set("jobTitle")} />
          </Field>
          <Field>
            <Label>Reporting Manager</Label>
            <input type="text" placeholder="Name of reporting manager" value={data.reportingManager} onChange={set("reportingManager")} />
          </Field>
          <Field>
            <Label>Reason for Requirement</Label>
            <select value={data.reasonForRequirement} onChange={set("reasonForRequirement")}>
              <option value="New">New</option>
              <option value="Replacement">Replacement</option>
            </select>
          </Field>
          {data.reasonForRequirement === "Replacement" && (
            <Field>
              <Label>Outgoing Employee Name</Label>
              <input type="text" placeholder="Name of outgoing employee" value={data.outgoingEmployeeName} onChange={set("outgoingEmployeeName")} />
            </Field>
          )}
          <Field>
            <Label>Number of Resources Required</Label>
            <input type="number" min={1} value={data.numberOfResources} onChange={set("numberOfResources")} />
          </Field>
        </Grid>
      </div>

      {/* Section 2 */}
      <div className="form-section">
        <SectionTitle num={2} title="Employment Terms" />
        <Grid>
          <Field>
            <Label>Employment Type</Label>
            <select value={data.employmentType} onChange={set("employmentType")}>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
            </select>
          </Field>
          {data.employmentType === "Contract" && (
            <>
              <Field>
                <Label>Contract Duration (Months)</Label>
                <input type="number" min={1} value={data.contractDurationMonths || ""} onChange={set("contractDurationMonths")} placeholder="e.g. 6" />
              </Field>
              <Field>
                <Label>Extension Possible?</Label>
                <select value={data.extensionPossible} onChange={set("extensionPossible")}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
              {data.extensionPossible === "Yes" && (
                <Field>
                  <Label>Extension Duration (Months)</Label>
                  <input type="number" min={1} value={data.extensionDurationMonths || ""} onChange={set("extensionDurationMonths")} placeholder="e.g. 6" />
                </Field>
              )}
            </>
          )}
          <Field>
            <Label>Experience Range — Minimum (Yrs)</Label>
            <input type="number" min={0} value={data.experienceMin || ""} onChange={set("experienceMin")} placeholder="e.g. 4" />
          </Field>
          <Field>
            <Label>Experience Range — Maximum (Yrs)</Label>
            <input type="number" min={0} value={data.experienceMax || ""} onChange={set("experienceMax")} placeholder="e.g. 8" />
          </Field>
        </Grid>

        {/* Budget — structured fields */}
        <div className="mt-2">
          <Label>Budget / CTC / Rate</Label>
          <p className="text-xs text-gray-500 mb-2">
            Vendor copy will show rates at −15% · Candidate copy at −20% (auto-calculated unless you enter a manual override in Sharing Settings)
          </p>
          <div className="grid grid-cols-[110px_1fr_1fr_140px] gap-2 items-end">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
              <select value={data.currency || "INR"} onChange={set("currency")} className="text-sm">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Min Amount</label>
              <input type="number" min={0} placeholder="e.g. 18" value={data.budgetMin || ""} onChange={set("budgetMin")} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Max Amount</label>
              <input type="number" min={0} placeholder="e.g. 22" value={data.budgetMax || ""} onChange={set("budgetMax")} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Unit</label>
              <select value={data.budgetUnit || "LPA"} onChange={set("budgetUnit")} className="text-sm">
                {BUDGET_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          {(data.budgetMin || data.budgetMax) && (
            <p className="text-xs text-brand-blue mt-1.5 font-medium">
              {data.currency || "INR"} {data.budgetMin || ""}
              {data.budgetMin && data.budgetMax ? `–${data.budgetMax}` : data.budgetMax || ""}
              {" "}{data.budgetUnit || "LPA"}
              {" · Vendor: "}{data.currency || "INR"} {data.budgetMin ? Math.round(data.budgetMin * 0.85) : ""}
              {data.budgetMin && data.budgetMax ? `–${Math.round(data.budgetMax * 0.85)}` : data.budgetMax ? Math.round(data.budgetMax * 0.85) : ""}
              {" "}{data.budgetUnit || "LPA"}
              {" · Candidate: "}{data.currency || "INR"} {data.budgetMin ? Math.round(data.budgetMin * 0.80) : ""}
              {data.budgetMin && data.budgetMax ? `–${Math.round(data.budgetMax * 0.80)}` : data.budgetMax ? Math.round(data.budgetMax * 0.80) : ""}
              {" "}{data.budgetUnit || "LPA"}
            </p>
          )}
        </div>

        <Grid>
          <Field className="mb-4 mt-4">
            <Label>Expected Notice Period</Label>
            <select value={data.noticePeriod} onChange={set("noticePeriod")}>
              <option value="Immediate">Immediate</option>
              <option value="15 Days">15 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="45 Days">45 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
            </select>
          </Field>
          <Field className="mb-4 mt-4">
            <Label>Possible Start Date</Label>
            <input type="date" value={data.possibleStartDate} onChange={set("possibleStartDate")} />
          </Field>
          <Field>
            <Label>Priority</Label>
            <select value={data.priority} onChange={set("priority")}>
              <option value="P0 - Critical">P0 — Critical</option>
              <option value="P1 - High">P1 — High</option>
              <option value="P2 - Medium">P2 — Medium</option>
              <option value="P3 - Low">P3 — Low</option>
            </select>
          </Field>
        </Grid>
      </div>

      {/* Section 3 */}
      <div className="form-section">
        <SectionTitle num={3} title="Location & Work Mode" />
        <Grid>
          <Field>
            <Label>Location (City / Region)</Label>
            <input type="text" placeholder="e.g. Bengaluru, Mumbai" value={data.location} onChange={set("location")} />
          </Field>
          <Field>
            <Label>Work Mode</Label>
            <select value={data.workMode} onChange={set("workMode")}>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </Field>
          {data.workMode === "Hybrid" && (
            <Field>
              <Label>Days in Office per Week</Label>
              <input type="number" min={1} max={6} value={data.daysInOffice || ""} onChange={set("daysInOffice")} placeholder="e.g. 3" />
            </Field>
          )}
        </Grid>
      </div>

      {/* Section 4 */}
      <div className="form-section">
        <SectionTitle num={4} title="Role Requirements" />
        <Field className="mb-4">
          <Label>About the Role</Label>
          <textarea
            rows={4}
            placeholder="Brief description of the company, team, and the opportunity. This paragraph appears in all three documents..."
            value={data.aboutRole || ""}
            onChange={set("aboutRole")}
          />
          <p className="field-hint">Appears in Internal, Vendor, and Candidate documents as a company/role overview</p>
        </Field>
        <Field className="mb-4">
          <Label required>Key Responsibilities</Label>
          <textarea
            rows={6}
            placeholder={"One responsibility per line:\nDesign and implement data pipelines\nCollaborate with stakeholders"}
            value={data.keyResponsibilities}
            onChange={set("keyResponsibilities")}
          />
          <p className="field-hint">One responsibility per line — each becomes a bullet point</p>
        </Field>
        <Field className="mb-4">
          <Label required>Mandatory Skills</Label>
          <textarea
            rows={5}
            placeholder={"One skill per line:\nPython\nSQL\nAWS"}
            value={data.mandatorySkills}
            onChange={set("mandatorySkills")}
          />
          <p className="field-hint">One skill per line</p>
        </Field>
        <Field className="mb-4">
          <Label>Good-to-Have Skills</Label>
          <textarea
            rows={3}
            placeholder={"One skill per line:\nKubernetes\nSpark"}
            value={data.goodToHaveSkills}
            onChange={set("goodToHaveSkills")}
          />
          <p className="field-hint">Optional — one per line</p>
        </Field>
        <Grid>
          <Field>
            <Label>Education / Qualification</Label>
            <input type="text" placeholder="e.g. B.Tech / B.E. in Computer Science" value={data.educationQualification} onChange={set("educationQualification")} />
          </Field>
          <Field>
            <Label>Certifications Required</Label>
            <input type="text" placeholder="e.g. AWS Certified Solutions Architect (optional)" value={data.certificationsRequired} onChange={set("certificationsRequired")} />
          </Field>
        </Grid>
      </div>

      {/* Section 5 */}
      <div className="form-section">
        <SectionTitle num={5} title="Interview Process" />
        <Field className="mb-5">
          <Label>Number of Interview Rounds</Label>
          <input
            type="number"
            min={1}
            max={10}
            value={data.numberOfInterviewRounds || ""}
            onChange={set("numberOfInterviewRounds")}
            placeholder="e.g. 3"
            className="max-w-[160px]"
          />
        </Field>

        {(data.numberOfInterviewRounds || 0) > 0 && (
          <div>
            <p className="field-label mb-3">Interviewer per Round</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: data.numberOfInterviewRounds }, (_, i) => {
                const rounds = data.interviewPanel.split(",").map((s) => s.trim());
                const val = rounds[i] ?? "";
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-10 h-9 rounded-lg bg-brand-light text-brand-dark text-xs font-bold flex items-center justify-center border border-brand-blue/20">
                      L{i + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Interviewer name (L${i + 1})`}
                      value={val}
                      onChange={(e) => {
                        const arr = data.interviewPanel.split(",").map((s) => s.trim());
                        while (arr.length <= i) arr.push("");
                        arr[i] = e.target.value;
                        onChange({ interviewPanel: arr.join(", ") });
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="field-hint mt-2">Interviewer names are hidden from Vendor and Candidate documents by default</p>
          </div>
        )}
      </div>

      {/* Section 6 */}
      <div className="form-section">
        <SectionTitle num={6} title="Additional Notes" />
        <Field>
          <Label>Additional Notes / Special Instructions</Label>
          <textarea
            rows={4}
            placeholder="Any special instructions, background context, or notes for the TA team (internal only by default)..."
            value={data.additionalNotes}
            onChange={set("additionalNotes")}
          />
          <p className="field-hint">Hidden from Vendor and Candidate documents by default</p>
        </Field>
      </div>
    </div>
  );
}
