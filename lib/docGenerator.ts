import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
  convertInchesToTwip,
  PageOrientation,
} from "docx";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { IntakeData, SharingSettings } from "@/types";

// ─── Logo loader (SVG → PNG buffer, cached) ───────────────────────────────────
let _logoBuf: Buffer | null = null;
async function getLogoPng(): Promise<Buffer | null> {
  if (_logoBuf) return _logoBuf;
  try {
    const svgPath = path.join(process.cwd(), "public", "logo.svg");
    const svgBuf = fs.readFileSync(svgPath);
    _logoBuf = await sharp(svgBuf).resize(320).png().toBuffer();
    return _logoBuf;
  } catch {
    return null;
  }
}

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND_BLUE = "1E9FD8";
const BRAND_DARK = "0E76A8";
const BRAND_GREEN = "2E9E5B";
const FONT = "Arial";
const PAGE_W = 11906; // A4 width in DXA
const PAGE_H = 16838; // A4 height in DXA
const MARGIN = convertInchesToTwip(0.8);

// ─── Derived string helpers ───────────────────────────────────────────────────
function buildEmploymentDetail(data: IntakeData): string {
  if (data.employmentType === "Contract") {
    const dur = data.contractDurationMonths
      ? `${data.contractDurationMonths} month${data.contractDurationMonths !== 1 ? "s" : ""}`
      : "unspecified duration";
    if (data.extensionPossible === "Yes" && data.extensionDurationMonths) {
      return `Contract (${dur}, extendable by ${data.extensionDurationMonths} month${data.extensionDurationMonths !== 1 ? "s" : ""})`;
    }
    return `Contract (${dur}, non-extendable)`;
  }
  return "Permanent";
}

function buildWorkModeDetail(data: IntakeData): string {
  if (data.workMode === "Hybrid") {
    const days = data.daysInOffice ? `${data.daysInOffice} day${data.daysInOffice !== 1 ? "s" : ""}` : "some days";
    const loc = data.location || "the office";
    return `Hybrid — ${days}/week from the ${loc} office`;
  }
  if (data.workMode === "Remote") return "Fully Remote";
  return `Onsite — ${data.location || "TBD"}`;
}

function buildExperienceRange(data: IntakeData): string {
  if (data.experienceMin && data.experienceMax) {
    return `${data.experienceMin}–${data.experienceMax} years`;
  }
  if (data.experienceMin) return `${data.experienceMin}+ years`;
  if (data.experienceMax) return `Up to ${data.experienceMax} years`;
  return "—";
}

// Build a formatted budget string, optionally applying a % reduction to numeric min/max
function buildBudgetDisplay(data: IntakeData, reductionPct = 0): string {
  const factor = 1 - reductionPct / 100;
  const curr = data.currency || "INR";
  const unit = data.budgetUnit || "";

  if (data.budgetMin || data.budgetMax) {
    const fmt = (n: number) => {
      const reduced = Math.round(n * factor);
      // Format with commas for large numbers
      return reduced.toLocaleString("en-IN");
    };
    if (data.budgetMin && data.budgetMax) {
      return `${curr} ${fmt(data.budgetMin)}–${fmt(data.budgetMax)} ${unit}`.trim();
    }
    if (data.budgetMin) return `${curr} ${fmt(data.budgetMin)}+ ${unit}`.trim();
    return `${curr} up to ${fmt(data.budgetMax)} ${unit}`.trim();
  }
  // Fallback to freetext budget field (no reduction applied)
  return data.budget || "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function resolve(
  value: string,
  override: string,
  include: boolean
): { include: boolean; displayValue: string } {
  return { include, displayValue: include ? (override.trim() || value) : "" };
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ─── Style helpers ────────────────────────────────────────────────────────────
function bannerParagraph(text: string, hexColor: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: "FFFFFF",
        size: 24,
        font: FONT,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: hexColor, fill: hexColor },
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
  });
}

function sectionHeading(text: string, color = BRAND_DARK): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        color,
        size: 22,
        font: FONT,
      }),
    ],
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color },
    },
  });
}

function logoAndTitleParagraphs(jobTitle: string, logoPng: Buffer | null): Paragraph[] {
  const paras: Paragraph[] = [];

  if (logoPng) {
    paras.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoPng,
            transformation: { width: 160, height: 100 },
            type: "png",
          }),
        ],
        spacing: { after: 80 },
      })
    );
  } else {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: "LatentBridge", bold: true, size: 32, color: BRAND_BLUE, font: FONT }),
          new TextRun({ text: "  |  Workflows to Outcomes", italics: true, size: 20, color: "666666", font: FONT }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  paras.push(
    new Paragraph({
      children: [new TextRun({ text: jobTitle, bold: true, size: 28, color: "222222", font: FONT })],
      spacing: { after: 80 },
    })
  );

  return paras;
}

function infoTable(rows: { label: string; value: string }[]): Table {
  const COL1 = 3000;
  const COL2 = 6500;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [COL1, COL2],
    rows: rows.map((r, i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL1, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? "EEF6FB" : "FFFFFF", fill: i % 2 === 0 ? "EEF6FB" : "FFFFFF" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: r.label, bold: true, size: 18, font: FONT, color: "333333" })],
                spacing: { before: 60, after: 60 },
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            },
          }),
          new TableCell({
            width: { size: COL2, type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? "EEF6FB" : "FFFFFF", fill: i % 2 === 0 ? "EEF6FB" : "FFFFFF" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: r.value || "—", size: 18, font: FONT, color: "111111" })],
                spacing: { before: 60, after: 60 },
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            },
          }),
        ],
      })
    ),
  });
}

function bulletList(items: string[]): Paragraph[] {
  return items.map(
    (item) =>
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: item, size: 20, font: FONT })],
        spacing: { before: 40, after: 40 },
      })
  );
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: FONT })],
    spacing: { before: 80, after: 80 },
  });
}

const numberingConfig = {
  config: [
    {
      reference: "bullet-list",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 360, hanging: 260 } },
            run: { font: "Symbol", size: 20 },
          },
        },
      ],
    },
  ],
};

// ─── Narrative paragraph builders ────────────────────────────────────────────

function buildInternalNarrative(data: IntakeData, employmentDetail: string, workModeDetail: string): string {
  const employer = data.requisitionType === "Client" && data.clientName
    ? data.clientName
    : "LatentBridge";
  const roleType = data.reasonForRequirement === "Replacement"
    ? `a replacement role (replacing ${data.outgoingEmployeeName || "outgoing employee"})`
    : "a new role";
  const dept = data.department ? ` in the ${data.department} department` : "";
  const reporting = data.reportingManager ? `, reporting to ${data.reportingManager}` : "";
  const exp = buildExperienceRange(data);

  return (
    `We are seeking a ${data.jobTitle || "professional"} for ${employer}${dept}. ` +
    `This is ${roleType}${reporting}. The engagement is ${employmentDetail}, ` +
    `based in ${workModeDetail}. ` +
    `The ideal candidate will have ${exp} of relevant experience.`
  );
}

function buildVendorNarrative(
  data: IntakeData,
  employmentDetail: string,
  workModeDetail: string,
  sharing: SharingSettings
): string {
  const clientRes = resolve(
    data.clientName,
    sharing.clientName.vendorOverride,
    sharing.clientName.vendorInclude
  );
  const employer = clientRes.include ? clientRes.displayValue : "LatentBridge";
  const deptRes = resolve(data.department, sharing.department.vendorOverride, sharing.department.vendorInclude);
  const dept = deptRes.include && deptRes.displayValue ? ` in the ${deptRes.displayValue} department` : "";
  const titleRes = resolve(data.jobTitle, sharing.jobTitle.vendorOverride, sharing.jobTitle.vendorInclude);
  const title = titleRes.displayValue || data.jobTitle || "professional";
  const expRes = resolve(buildExperienceRange(data), sharing.experienceRange.vendorOverride, sharing.experienceRange.vendorInclude);
  const exp = expRes.include ? expRes.displayValue : "";
  const wmRes = resolve(workModeDetail, sharing.workMode.vendorOverride, sharing.workMode.vendorInclude);
  const etRes = resolve(employmentDetail, sharing.employmentTypeAndDuration.vendorOverride, sharing.employmentTypeAndDuration.vendorInclude);

  let narrative = `LatentBridge is looking for a ${title} for ${employer}${dept}. `;
  if (etRes.include) narrative += `This is a ${etRes.displayValue} engagement`;
  if (wmRes.include) narrative += `${etRes.include ? ", " : "The role is "}${wmRes.displayValue}`;
  narrative += ". ";
  if (exp) narrative += `The candidate should have ${exp} of relevant experience. `;

  return narrative.trim();
}

function buildCandidateNarrative(
  data: IntakeData,
  employmentDetail: string,
  workModeDetail: string,
  sharing: SharingSettings
): string {
  const clientRes = resolve(
    data.clientName,
    sharing.clientName.candidateOverride,
    sharing.clientName.candidateInclude
  );
  const employer = clientRes.include && clientRes.displayValue ? `our client, ${clientRes.displayValue},` : "our team";
  const titleRes = resolve(data.jobTitle, sharing.jobTitle.candidateOverride, sharing.jobTitle.candidateInclude);
  const title = titleRes.displayValue || data.jobTitle || "a talented professional";
  const expRes = resolve(buildExperienceRange(data), sharing.experienceRange.candidateOverride, sharing.experienceRange.candidateInclude);
  const wmRes = resolve(workModeDetail, sharing.workMode.candidateOverride, sharing.workMode.candidateInclude);
  const etRes = resolve(employmentDetail, sharing.employmentTypeAndDuration.candidateOverride, sharing.employmentTypeAndDuration.candidateInclude);

  let narrative = `We are looking for an experienced ${title} to join ${employer}. `;
  if (etRes.include) narrative += `This is a ${etRes.displayValue} position`;
  if (wmRes.include) narrative += `${etRes.include ? " " : "The role is "}(${wmRes.displayValue})`;
  if (etRes.include || wmRes.include) narrative += ". ";
  if (expRes.include) narrative += `We are looking for candidates with ${expRes.displayValue} of relevant experience. `;

  return narrative.trim();
}

// ─── Document builders ────────────────────────────────────────────────────────

async function buildInternalDoc(data: IntakeData, logoPng: Buffer | null): Promise<Buffer> {
  const employmentDetail = buildEmploymentDetail(data);
  const workModeDetail = buildWorkModeDetail(data);
  const expRange = buildExperienceRange(data);

  const snapshotRows = [
    { label: "Requisition Date", value: data.requisitionDate },
    { label: "Created By", value: data.createdBy },
    { label: "Requested By", value: data.requestedBy },
    { label: "Requisition Type", value: data.requisitionType === "Client" ? `Client — ${data.clientName}` : "Internal" },
    { label: "Department", value: data.department },
    { label: "Job Title", value: data.jobTitle },
    { label: "Reporting Manager", value: data.reportingManager },
    { label: "Reason", value: data.reasonForRequirement === "Replacement" ? `Replacement (${data.outgoingEmployeeName || "N/A"})` : "New" },
    { label: "No. of Openings", value: String(data.numberOfResources || 1) },
    { label: "Employment Type", value: employmentDetail },
    { label: "Experience", value: expRange },
    { label: "Budget / CTC / Rate", value: buildBudgetDisplay(data) },
    { label: "Notice Period", value: data.noticePeriod },
    { label: "Start Date", value: data.possibleStartDate },
    { label: "Priority", value: data.priority },
    { label: "Location & Work Mode", value: workModeDetail },
    { label: "Interview Rounds", value: String(data.numberOfInterviewRounds || "—") },
    { label: "Interview Panel", value: data.interviewPanel },
    { label: "Education", value: data.educationQualification },
    { label: "Certifications", value: data.certificationsRequired },
  ].filter((r) => r.value);

  const children: (Paragraph | Table)[] = [
    ...logoAndTitleParagraphs(data.jobTitle || "Untitled Position", logoPng),
    bannerParagraph("INTERNAL — TA TEAM USE ONLY (Full Detail)", BRAND_DARK),
    new Paragraph({ children: [], spacing: { after: 120 } }),
    sectionHeading("Requisition Snapshot", BRAND_DARK),
    new Paragraph({ children: [], spacing: { after: 80 } }),
    infoTable(snapshotRows),
    new Paragraph({ children: [], spacing: { after: 160 } }),
    sectionHeading("About the Role", BRAND_DARK),
    bodyParagraph(buildInternalNarrative(data, employmentDetail, workModeDetail)),
    ...(data.aboutRole ? [bodyParagraph(data.aboutRole)] : []),
  ];

  const responsibilities = splitLines(data.keyResponsibilities);
  if (responsibilities.length) {
    children.push(sectionHeading("Key Responsibilities", BRAND_DARK));
    children.push(...bulletList(responsibilities));
  }

  const mandatory = splitLines(data.mandatorySkills);
  if (mandatory.length) {
    children.push(sectionHeading("Mandatory Skills", BRAND_DARK));
    children.push(...bulletList(mandatory));
  }

  const niceToHave = splitLines(data.goodToHaveSkills);
  if (niceToHave.length) {
    children.push(sectionHeading("Good-to-Have Skills", BRAND_DARK));
    children.push(...bulletList(niceToHave));
  }

  const eduCerts = [data.educationQualification, data.certificationsRequired].filter(Boolean).join(" | ");
  if (eduCerts) {
    children.push(sectionHeading("Education & Certifications", BRAND_DARK));
    children.push(bodyParagraph(eduCerts));
  }

  if (data.additionalNotes) {
    children.push(sectionHeading("Internal Notes", BRAND_DARK));
    children.push(bodyParagraph(data.additionalNotes));
  }

  const doc = new Document({
    numbering: numberingConfig,
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.PORTRAIT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}

async function buildVendorDoc(data: IntakeData, sharing: SharingSettings, logoPng: Buffer | null): Promise<Buffer> {
  const employmentDetail = buildEmploymentDetail(data);
  const workModeDetail = buildWorkModeDetail(data);
  const expRange = buildExperienceRange(data);

  const allRows: { key: string; label: string; value: string; vendorInclude: boolean; vendorOverride: string }[] = [
    { key: "jobTitle", label: "Job Title", value: data.jobTitle, vendorInclude: sharing.jobTitle.vendorInclude, vendorOverride: sharing.jobTitle.vendorOverride },
    { key: "department", label: "Department", value: data.department, vendorInclude: sharing.department.vendorInclude, vendorOverride: sharing.department.vendorOverride },
    { key: "clientName", label: "Client", value: data.clientName, vendorInclude: sharing.clientName.vendorInclude, vendorOverride: sharing.clientName.vendorOverride },
    { key: "location", label: "Location", value: data.location, vendorInclude: sharing.location.vendorInclude, vendorOverride: sharing.location.vendorOverride },
    { key: "workMode", label: "Work Mode", value: workModeDetail, vendorInclude: sharing.workMode.vendorInclude, vendorOverride: sharing.workMode.vendorOverride },
    { key: "employmentTypeAndDuration", label: "Employment Type", value: employmentDetail, vendorInclude: sharing.employmentTypeAndDuration.vendorInclude, vendorOverride: sharing.employmentTypeAndDuration.vendorOverride },
    { key: "experienceRange", label: "Experience", value: expRange, vendorInclude: sharing.experienceRange.vendorInclude, vendorOverride: sharing.experienceRange.vendorOverride },
    // Budget: auto-apply 15% reduction for vendor unless manual override provided
    { key: "budget", label: "Budget / CTC / Rate", value: buildBudgetDisplay(data, 15), vendorInclude: sharing.budget.vendorInclude, vendorOverride: sharing.budget.vendorOverride },
    { key: "reportingManager", label: "Reporting Manager", value: data.reportingManager, vendorInclude: sharing.reportingManager.vendorInclude, vendorOverride: sharing.reportingManager.vendorOverride },
    { key: "numberOfOpenings", label: "No. of Openings", value: String(data.numberOfResources || 1), vendorInclude: sharing.numberOfOpenings.vendorInclude, vendorOverride: sharing.numberOfOpenings.vendorOverride },
    { key: "numberOfInterviewRounds", label: "Interview Rounds", value: String(data.numberOfInterviewRounds || ""), vendorInclude: sharing.numberOfInterviewRounds.vendorInclude, vendorOverride: sharing.numberOfInterviewRounds.vendorOverride },
    { key: "interviewPanelNames", label: "Interview Panel", value: data.interviewPanel, vendorInclude: sharing.interviewPanelNames.vendorInclude, vendorOverride: sharing.interviewPanelNames.vendorOverride },
    { key: "noticePeriod", label: "Notice Period", value: data.noticePeriod, vendorInclude: sharing.noticePeriod.vendorInclude, vendorOverride: sharing.noticePeriod.vendorOverride },
    { key: "possibleStartDate", label: "Possible Start Date", value: data.possibleStartDate, vendorInclude: sharing.possibleStartDate.vendorInclude, vendorOverride: sharing.possibleStartDate.vendorOverride },
  ];

  const tableRows = allRows
    .filter((r) => r.vendorInclude && r.value)
    .map((r) => ({ label: r.label, value: r.vendorOverride.trim() || r.value }));

  const children: (Paragraph | Table)[] = [
    ...logoAndTitleParagraphs(data.jobTitle || "Untitled Position", logoPng),
    bannerParagraph("VENDOR PARTNER — ROLE BRIEF", BRAND_BLUE),
    new Paragraph({ children: [], spacing: { after: 120 } }),
    sectionHeading("Role Overview", BRAND_BLUE),
    new Paragraph({ children: [], spacing: { after: 80 } }),
    ...(tableRows.length ? [infoTable(tableRows)] : []),
    new Paragraph({ children: [], spacing: { after: 160 } }),
    sectionHeading("About the Role", BRAND_BLUE),
    bodyParagraph(buildVendorNarrative(data, employmentDetail, workModeDetail, sharing)),
    ...(data.aboutRole ? [bodyParagraph(data.aboutRole)] : []),
  ];

  if (sharing.keyResponsibilities.vendorInclude) {
    const responsibilities = splitLines(data.keyResponsibilities);
    if (responsibilities.length) {
      children.push(sectionHeading("Key Responsibilities", BRAND_BLUE));
      children.push(...bulletList(responsibilities));
    }
  }

  if (sharing.mandatorySkills.vendorInclude) {
    const mandatory = splitLines(data.mandatorySkills);
    if (mandatory.length) {
      children.push(sectionHeading("Mandatory Skills", BRAND_BLUE));
      children.push(...bulletList(mandatory));
    }
  }

  if (sharing.goodToHaveSkills.vendorInclude) {
    const niceToHave = splitLines(data.goodToHaveSkills);
    if (niceToHave.length) {
      children.push(sectionHeading("Good-to-Have Skills", BRAND_BLUE));
      children.push(...bulletList(niceToHave));
    }
  }

  const eduParts: string[] = [];
  if (sharing.educationQualification.vendorInclude && data.educationQualification)
    eduParts.push(sharing.educationQualification.vendorOverride || data.educationQualification);
  if (sharing.certifications.vendorInclude && data.certificationsRequired)
    eduParts.push(sharing.certifications.vendorOverride || data.certificationsRequired);
  if (eduParts.length) {
    children.push(sectionHeading("Education & Certifications", BRAND_BLUE));
    children.push(bodyParagraph(eduParts.join(" | ")));
  }

  children.push(sectionHeading("Selection Process", BRAND_BLUE));
  children.push(
    bodyParagraph(
      "Please share shortlisted profiles with an updated resume, current/expected compensation details, " +
        "and notice period to your designated LatentBridge Talent Acquisition contact. " +
        "We look forward to reviewing your submissions."
    )
  );

  if (sharing.additionalNotes.vendorInclude && data.additionalNotes) {
    children.push(sectionHeading("Additional Notes", BRAND_BLUE));
    children.push(bodyParagraph(sharing.additionalNotes.vendorOverride || data.additionalNotes));
  }

  const doc = new Document({
    numbering: numberingConfig,
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.PORTRAIT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}

async function buildCandidateDoc(data: IntakeData, sharing: SharingSettings, logoPng: Buffer | null): Promise<Buffer> {
  const employmentDetail = buildEmploymentDetail(data);
  const workModeDetail = buildWorkModeDetail(data);
  const expRange = buildExperienceRange(data);

  const allRows: { label: string; value: string; include: boolean; override: string }[] = [
    { label: "Position", value: data.jobTitle, include: sharing.jobTitle.candidateInclude, override: sharing.jobTitle.candidateOverride },
    { label: "Department", value: data.department, include: sharing.department.candidateInclude, override: sharing.department.candidateOverride },
    { label: "Client", value: data.clientName, include: sharing.clientName.candidateInclude, override: sharing.clientName.candidateOverride },
    { label: "Location", value: data.location, include: sharing.location.candidateInclude, override: sharing.location.candidateOverride },
    { label: "Work Mode", value: workModeDetail, include: sharing.workMode.candidateInclude, override: sharing.workMode.candidateOverride },
    { label: "Employment Type", value: employmentDetail, include: sharing.employmentTypeAndDuration.candidateInclude, override: sharing.employmentTypeAndDuration.candidateOverride },
    { label: "Experience Required", value: expRange, include: sharing.experienceRange.candidateInclude, override: sharing.experienceRange.candidateOverride },
    // Budget: auto-apply 20% reduction for candidate unless manual override provided
    { label: "Compensation", value: buildBudgetDisplay(data, 20), include: sharing.budget.candidateInclude, override: sharing.budget.candidateOverride },
    { label: "Reporting To", value: data.reportingManager, include: sharing.reportingManager.candidateInclude, override: sharing.reportingManager.candidateOverride },
    { label: "No. of Openings", value: String(data.numberOfResources || 1), include: sharing.numberOfOpenings.candidateInclude, override: sharing.numberOfOpenings.candidateOverride },
    { label: "Interview Rounds", value: String(data.numberOfInterviewRounds || ""), include: sharing.numberOfInterviewRounds.candidateInclude, override: sharing.numberOfInterviewRounds.candidateOverride },
    { label: "Notice Period", value: data.noticePeriod, include: sharing.noticePeriod.candidateInclude, override: sharing.noticePeriod.candidateOverride },
    { label: "Possible Start Date", value: data.possibleStartDate, include: sharing.possibleStartDate.candidateInclude, override: sharing.possibleStartDate.candidateOverride },
  ];

  const tableRows = allRows
    .filter((r) => r.include && r.value)
    .map((r) => ({ label: r.label, value: r.override.trim() || r.value }));

  const children: (Paragraph | Table)[] = [
    ...logoAndTitleParagraphs(data.jobTitle || "Untitled Position", logoPng),
    bannerParagraph("JOB OPPORTUNITY", BRAND_GREEN),
    new Paragraph({ children: [], spacing: { after: 120 } }),
    sectionHeading("Role Overview", BRAND_GREEN),
    new Paragraph({ children: [], spacing: { after: 80 } }),
    ...(tableRows.length ? [infoTable(tableRows)] : []),
    new Paragraph({ children: [], spacing: { after: 160 } }),
    sectionHeading("About the Role", BRAND_GREEN),
    bodyParagraph(buildCandidateNarrative(data, employmentDetail, workModeDetail, sharing)),
    ...(data.aboutRole ? [bodyParagraph(data.aboutRole)] : []),
  ];

  if (sharing.keyResponsibilities.candidateInclude) {
    const responsibilities = splitLines(data.keyResponsibilities);
    if (responsibilities.length) {
      children.push(sectionHeading("What You'll Do", BRAND_GREEN));
      children.push(...bulletList(responsibilities));
    }
  }

  if (sharing.mandatorySkills.candidateInclude) {
    const mandatory = splitLines(data.mandatorySkills);
    if (mandatory.length) {
      children.push(sectionHeading("What We're Looking For", BRAND_GREEN));
      children.push(...bulletList(mandatory));
    }
  }

  if (sharing.goodToHaveSkills.candidateInclude) {
    const niceToHave = splitLines(data.goodToHaveSkills);
    if (niceToHave.length) {
      children.push(sectionHeading("Good-to-Have Skills (Preferred, Not Mandatory)", BRAND_GREEN));
      children.push(...bulletList(niceToHave));
    }
  }

  const eduParts: string[] = [];
  if (sharing.educationQualification.candidateInclude && data.educationQualification)
    eduParts.push(sharing.educationQualification.candidateOverride || data.educationQualification);
  if (sharing.certifications.candidateInclude && data.certificationsRequired)
    eduParts.push(sharing.certifications.candidateOverride || data.certificationsRequired);
  if (eduParts.length) {
    children.push(sectionHeading("Education & Certifications", BRAND_GREEN));
    children.push(bodyParagraph(eduParts.join(" | ")));
  }

  children.push(sectionHeading("Why Join", BRAND_GREEN));
  children.push(
    bodyParagraph(
      "LatentBridge connects exceptional talent with meaningful opportunities. " +
        "We work closely with our clients to ensure the right fit — not just in skills, but in culture and growth potential. " +
        "We look forward to reviewing your application and discussing this opportunity with you."
    )
  );

  const doc = new Document({
    numbering: numberingConfig,
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.PORTRAIT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateDocuments(
  data: IntakeData,
  sharing: SharingSettings,
  docType?: "internal" | "vendor" | "candidate"
): Promise<{ internal: Buffer; vendor: Buffer; candidate: Buffer; slug: string }> {
  const logoPng = await getLogoPng();

  const empty = Buffer.alloc(0);
  const shouldBuild = (t: "internal" | "vendor" | "candidate") => !docType || docType === t;

  const [internal, vendor, candidate] = await Promise.all([
    shouldBuild("internal") ? buildInternalDoc(data, logoPng) : Promise.resolve(empty),
    shouldBuild("vendor") ? buildVendorDoc(data, sharing, logoPng) : Promise.resolve(empty),
    shouldBuild("candidate") ? buildCandidateDoc(data, sharing, logoPng) : Promise.resolve(empty),
  ]);

  return {
    internal: Buffer.from(internal),
    vendor: Buffer.from(vendor),
    candidate: Buffer.from(candidate),
    slug: slugify(data.jobTitle || "position"),
  };
}
