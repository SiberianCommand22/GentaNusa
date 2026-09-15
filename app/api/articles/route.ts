import { NextResponse, type NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { apiError } from "../error-handler";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// GET /api/articles — daftar artikel (public)
export async function GET() {
  try {
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    const { data, error } = await c.client
      .from("articles")
      .select("*")
      .order("date", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}

// POST /api/articles — tambah artikel (admin)
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
    }
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.content) {
      return NextResponse.json({ error: "title dan content wajib" }, { status: 400 });
    }

    const { data, error } = await c.client
      .from("articles")
      .insert([
        {
          title: body.title,
          category: body.category || "Nasional",
          excerpt: body.excerpt || "",
          content: body.content,
          image: body.image || null,
          tags: body.tags || [],
          author: body.author || "Redaksi",
          author_slug: body.authorSlug || null,
          author_role: body.authorRole || null,
          date: body.date || new Date().toISOString().slice(0, 10),
        },
      ])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}