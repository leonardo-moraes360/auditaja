import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { indiceDeParlamentares } from "@/data/seo";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

type RevalidateResult = {
  revalidated: boolean;
  paths: string[];
  parlamentares?: number;
  timestamp: string;
  error?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse<RevalidateResult>> {
  const timestamp = new Date().toISOString();

  if (!REVALIDATE_SECRET) {
    return NextResponse.json(
      {
        revalidated: false,
        paths: [],
        timestamp,
        error: "REVALIDATE_SECRET not configured on server",
      },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token !== REVALIDATE_SECRET) {
    return NextResponse.json(
      {
        revalidated: false,
        paths: [],
        timestamp,
        error: "Invalid or missing authorization token",
      },
      { status: 401 },
    );
  }

  try {
    const parlamentares = await indiceDeParlamentares();

    revalidatePath("/parlamentares", "layout");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llms-full.txt");

    for (const p of parlamentares) {
      revalidatePath(`/parlamentares/${p.id}`, "page");
      revalidatePath(`/parlamentares/${p.id}.md`);
    }

    const paths = [
      "/parlamentares (layout)",
      "/sitemap.xml",
      "/llms.txt",
      "/llms-full.txt",
      ...parlamentares.map((p) => `/parlamentares/${p.id}`),
    ];

    return NextResponse.json({
      revalidated: true,
      paths,
      parlamentares: parlamentares.length,
      timestamp,
    });
  } catch (error) {
    return NextResponse.json(
      {
        revalidated: false,
        paths: [],
        timestamp,
        error: error instanceof Error ? error.message : "Unknown error during revalidation",
      },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: "Use POST with Authorization: Bearer <REVALIDATE_SECRET> to trigger revalidation",
      timestamp: new Date().toISOString(),
    },
    { status: 405 },
  );
}
