export interface IntakeData {
  // Section 1 - Requisition Details
  requisitionDate: string;
  createdBy: string;
  requestedBy: string;
  requisitionType: "Internal" | "Client";
  clientName: string;
  department: string;
  jobTitle: string;
  reportingManager: string;
  reasonForRequirement: "New" | "Replacement";
  outgoingEmployeeName: string;
  numberOfResources: number;

  // Section 2 - Employment Terms
  employmentType: "Permanent" | "Contract";
  contractDurationMonths: number;
  extensionPossible: "Yes" | "No";
  extensionDurationMonths: number;
  experienceMin: number;
  experienceMax: number;
  // Structured budget (replaces freetext budget)
  currency: string;       // "INR", "USD", etc.
  budgetMin: number;
  budgetMax: number;
  budgetUnit: string;     // "LPA", "per month", "per hour", "per annum"
  budget: string;         // kept for backward compat / freetext fallback
  noticePeriod: "Immediate" | "15 Days" | "30 Days" | "45 Days" | "60 Days" | "90 Days";
  possibleStartDate: string;
  priority: "P0 - Critical" | "P1 - High" | "P2 - Medium" | "P3 - Low";

  // Section 3 - Location & Work Mode
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  daysInOffice: number;

  // Section 4 - Role Requirements
  aboutRole: string;       // About the Role / Company overview
  mandatorySkills: string;
  goodToHaveSkills: string;
  keyResponsibilities: string;
  educationQualification: string;
  certificationsRequired: string;

  // Section 5 - Interview Process
  numberOfInterviewRounds: number;
  interviewPanel: string;

  // Section 6 - Additional Notes
  additionalNotes: string;
}

export interface FieldSharingConfig {
  vendorInclude: boolean;
  vendorOverride: string;
  candidateInclude: boolean;
  candidateOverride: string;
}

export type SharingSettings = {
  [K in SharingField]: FieldSharingConfig;
};

export type SharingField =
  | "jobTitle"
  | "department"
  | "clientName"
  | "location"
  | "workMode"
  | "employmentTypeAndDuration"
  | "experienceRange"
  | "budget"
  | "reportingManager"
  | "numberOfOpenings"
  | "keyResponsibilities"
  | "mandatorySkills"
  | "goodToHaveSkills"
  | "educationQualification"
  | "certifications"
  | "numberOfInterviewRounds"
  | "interviewPanelNames"
  | "noticePeriod"
  | "possibleStartDate"
  | "additionalNotes";

export const SHARING_FIELD_LABELS: Record<SharingField, string> = {
  jobTitle: "Job Title",
  department: "Department",
  clientName: "Client Name",
  location: "Location",
  workMode: "Work Mode",
  employmentTypeAndDuration: "Employment Type & Duration",
  experienceRange: "Experience Range",
  budget: "Budget / CTC / Rate",
  reportingManager: "Reporting Manager",
  numberOfOpenings: "Number of Openings",
  keyResponsibilities: "Key Responsibilities",
  mandatorySkills: "Mandatory Skills",
  goodToHaveSkills: "Good-to-Have Skills",
  educationQualification: "Education / Qualification",
  certifications: "Certifications",
  numberOfInterviewRounds: "Number of Interview Rounds",
  interviewPanelNames: "Interview Panel Names",
  noticePeriod: "Notice Period Preference",
  possibleStartDate: "Possible Start Date",
  additionalNotes: "Additional Notes",
};

// Updated defaults: vendor & candidate have restricted defaults as per policy
export const DEFAULT_SHARING_SETTINGS: SharingSettings = {
  jobTitle:                 { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  department:               { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  clientName:               { vendorInclude: false, vendorOverride: "", candidateInclude: false, candidateOverride: "" },
  location:                 { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  workMode:                 { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  employmentTypeAndDuration:{ vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  experienceRange:          { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  // budget: included for both; auto-reduced 15% (vendor) / 20% (candidate) unless overridden
  budget:                   { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  reportingManager:         { vendorInclude: false, vendorOverride: "", candidateInclude: false, candidateOverride: "" },
  numberOfOpenings:         { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  keyResponsibilities:      { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  mandatorySkills:          { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  goodToHaveSkills:         { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  educationQualification:   { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  certifications:           { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  numberOfInterviewRounds:  { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  interviewPanelNames:      { vendorInclude: false, vendorOverride: "", candidateInclude: false, candidateOverride: "" },
  noticePeriod:             { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  possibleStartDate:        { vendorInclude: true,  vendorOverride: "", candidateInclude: true,  candidateOverride: "" },
  additionalNotes:          { vendorInclude: false, vendorOverride: "", candidateInclude: false, candidateOverride: "" },
};

export const SHARING_FIELDS_ORDER: SharingField[] = [
  "jobTitle",
  "department",
  "clientName",
  "location",
  "workMode",
  "employmentTypeAndDuration",
  "experienceRange",
  "budget",
  "reportingManager",
  "numberOfOpenings",
  "keyResponsibilities",
  "mandatorySkills",
  "goodToHaveSkills",
  "educationQualification",
  "certifications",
  "numberOfInterviewRounds",
  "interviewPanelNames",
  "noticePeriod",
  "possibleStartDate",
  "additionalNotes",
];

export const CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED", "SGD", "CAD", "AUD", "JPY", "MYR"];
export const BUDGET_UNITS = ["LPA", "per month", "per day", "per hour", "per annum", "fixed"];

// Saved requisition record stored in localStorage
export interface SavedReq {
  id: string;
  savedAt: string;
  jobTitle: string;
  clientName: string;
  requisitionType: string;
  intakeData: IntakeData;
  sharingSettings: SharingSettings;
}
