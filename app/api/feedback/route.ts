import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCorrectionCount, submitFeedback } from "@/lib/feedback";

export const runtime = "nodejs";

function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/** GET /api/feedback?hash=... — bilang ng community corrections. */
export async function GET(req: Request) {
  const hash = new URL(req.url).searchParams.get("hash");
  if (!hash || !/^h[a-z0-9]+$/.test(hash)) {
    return NextResponse.json({ count: 0 });
  }
  return NextResponse.json({ count: await getCorrectionCount(hash) });
}

/** POST /api/feedback — thumbs/correction para sa isang sagot. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = checkRateLimit(ip ?? "unknown");
  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          limit.scope === "daily"
            ? "Naabot mo na ang daily limit. Balik ka bukas."
            : "Masyadong mabilis ang pag-submit. Sandali lang.",
      },
      { status: 429 },
    );
  }

  let body: {
    answerHash?: unknown;
    helpful?: unknown;
    correction?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const hash = typeof body.answerHash === "string" ? body.answerHash : "";
  if (!/^h[a-z0-9]+$/.test(hash)) {
    return NextResponse.json({ error: "Invalid answerHash." }, { status: 400 });
  }
  const helpful =
    body.helpful === true ? true : body.helpful === false ? false : null;
  const correction =
    typeof body.correction === "string" && body.correction.trim()
      ? body.correction.trim().slice(0, 2000)
      : null;

  if (helpful === null && !correction) {
    return NextResponse.json(
      { error: "Pumili ng thumbs o magbigay ng correction." },
      { status: 400 },
    );
  }

  await submitFeedback({ answerHash: hash, helpful, correction, clientIp: ip });
  return NextResponse.json({ ok: true });
}
