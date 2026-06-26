"use client";
import React, { useEffect, useState } from "react";
import type { SavedReq, IntakeData, SharingSettings } from "@/types";
import { loadReqs, deleteReq } from "@/lib/savedReqs";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (intake: IntakeData, sharing: SharingSettings) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SavedReqsPanel({ open, onClose, onLoad }: Props) {
  const [reqs, setReqs] = useState<SavedReq[]>([]);

  useEffect(() => {
    if (open) setReqs(loadReqs());
  }, [open]);

  function handleLoad(req: SavedReq) {
    onLoad(req.intakeData, req.sharingSettings);
    onClose();
  }

  function handleDelete(id: string) {
    setReqs(deleteReq(id));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200" style={{ background: "#DDEEF7" }}>
          <div>
            <h2 className="text-base font-bold text-brand-dark">Saved Requisitions</h2>
            <p className="text-xs text-gray-500 mt-0.5">{reqs.length} saved · Click to load &amp; generate docs</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/60 transition-colors text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">No saved requisitions yet</p>
              <p className="text-xs mt-1">Fill the form and click "Save Requisition"</p>
            </div>
          ) : (
            reqs.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 bg-white hover:border-brand-blue hover:shadow-sm transition-all p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{req.jobTitle}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {req.requisitionType === "Client" && req.clientName
                        ? req.clientName
                        : "Internal"}
                      {" · "}
                      {timeAgo(req.savedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(req.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => handleLoad(req)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #1E9FD8 0%, #0E76A8 100%)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Load &amp; Generate
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
