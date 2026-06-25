import { NextRequest, NextResponse } from "next/server";
import { generateDocuments } from "@/lib/docGenerator";
import type { IntakeData, SharingSettings } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intakeData, sharingSettings } = body as {
      intakeData: IntakeData;
      sharingSettings: SharingSettings;
    };

    if (!intakeData || !sharingSettings) {
      return NextResponse.json({ error: "Missing intakeData or sharingSettings" }, { status: 400 });
    }

    const { internal, vendor, candidate, slug } = await generateDocuments(intakeData, sharingSettings);

    return NextResponse.json({
      internal: Buffer.from(internal).toString("base64"),
      vendor: Buffer.from(vendor).toString("base64"),
      candidate: Buffer.from(candidate).toString("base64"),
      slug,
    });
  } catch (err) {
    console.error("Doc generation error:", err);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
