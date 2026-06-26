import type { SavedReq, IntakeData, SharingSettings } from "@/types";

const LS_KEY = "latentbridge_reqs_v1";

export function loadReqs(): SavedReq[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]") as SavedReq[];
  } catch {
    return [];
  }
}

export function saveReq(intakeData: IntakeData, sharingSettings: SharingSettings): SavedReq {
  const reqs = loadReqs();
  const rec: SavedReq = {
    id: `req_${Date.now()}`,
    savedAt: new Date().toISOString(),
    jobTitle: intakeData.jobTitle || "Untitled Position",
    clientName: intakeData.clientName || "",
    requisitionType: intakeData.requisitionType,
    intakeData,
    sharingSettings,
  };
  // Prepend newest first; keep max 50 records
  const updated = [rec, ...reqs].slice(0, 50);
  localStorage.setItem(LS_KEY, JSON.stringify(updated));
  return rec;
}

export function deleteReq(id: string): SavedReq[] {
  const updated = loadReqs().filter((r) => r.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(updated));
  return updated;
}
