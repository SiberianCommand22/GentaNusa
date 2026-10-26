import { adminClient } from "@/lib/supabase";
import type { ActivityEvent, PolaroidPhoto } from "@/types/peduli";

/**
 * Helper baca data kanal Peduli — HANYA untuk Server Component / Route
 * Handler (memakai `adminClient`, Service Role Key). Jangan diimpor dari
 * komponen "use client".
 */

type Row = Record<string, unknown>;

function asRecord(value: unknown): Row {
  return value && typeof value === "object" ? (value as Row) : {};
}

function normalizePhoto(value: unknown): PolaroidPhoto | null {
  const row = asRecord(value);
  const photo = row as unknown as PolaroidPhoto;
  const src = String(photo.src || photo.image_url || photo.url || "").trim();
  if (!src) return null;
  return {
    ...photo,
    id: photo.id || `photo-${src}`,
    src,
  };
}

function comparePhoto(a: PolaroidPhoto, b: PolaroidPhoto): number {
  const orderA = a.order_index ?? a.sort_order ?? 0;
  const orderB = b.order_index ?? b.sort_order ?? 0;
  if (orderA !== orderB) return orderA - orderB;
  return String(a.created_at || "").localeCompare(String(b.created_at || ""));
}

function normalizeEvent(value: unknown): ActivityEvent | null {
  const row = asRecord(value);
  if (typeof row.id !== "string" || !row.id) return null;
  const event = row as unknown as ActivityEvent;
  const photos = Array.isArray(event.photos)
    ? event.photos
    : Array.isArray(row.peduli_photos)
      ? (row.peduli_photos as unknown[])
      : [];
  return {
    ...event,
    photos: photos
      .map(normalizePhoto)
      .filter((photo): photo is PolaroidPhoto => photo !== null)
      .sort(comparePhoto),
  };
}

/**
 * Ambil seluruh kegiatan Peduli beserta fotonya.
 * Gagal/jaringan mati = `[]` (halaman publik menampilkan placeholder).
 */
export async function fetchPeduliEvents(): Promise<ActivityEvent[]> {
  if (!adminClient) {
    console.warn("[lib/peduli] adminClient tidak tersedia (Supabase belum siap)");
    return [];
  }
  try {
    const { data, error } = await adminClient
      .from("peduli_events")
      .select("*, peduli_photos(*)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[lib/peduli] gagal membaca peduli_events:", error.message);
      return [];
    }
    return (Array.isArray(data) ? data : [])
      .map(normalizeEvent)
      .filter((event): event is ActivityEvent => event !== null);
  } catch (err) {
    console.error(
      "[lib/peduli] kesalahan tak terduga:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}
