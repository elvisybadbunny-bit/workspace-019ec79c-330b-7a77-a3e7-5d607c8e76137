import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/core/session";
import { buildPaymentReceiptPdf } from "@/lib/services/document.service";
import { handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** GET /api/payments/:id/receipt — download a co-branded PDF receipt (A.10). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission("finance.view");
    const { pdf, receiptNo } = await buildPaymentReceiptPdf(
      user.tenantId,
      params.id
    );
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receiptNo}.pdf"`,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
