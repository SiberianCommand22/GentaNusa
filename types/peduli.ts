export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface UrgentNeed {
  title?: string;
  item?: string;
  amount?: string | number;
  collected?: string | number;
  priority?: "high" | "medium" | "low";
}

/**
 * Baris `peduli_photos` (skema: scripts/peduli-schema.sql).
 * `src` NOT NULL — setiap foto WAJIB punya URL gambar.
 * `image_url`/`url`/`note`/`sort_order` adalah alias legacy lama, tetap
 * ditoleransi saat membaca baris lawas.
 */
export interface PolaroidPhoto {
  id: string;
  event_id?: string;
  src: string;
  image_url?: string | null;
  url?: string | null;
  note?: string | null;
  caption?: string | null;
  alt?: string | null;
  handwritten_note?: string | null;
  photographer?: string | null;
  timestamp?: string | null;
  rotation_deg?: number | null;
  sort_order?: number | null;
  order_index?: number | null;
  story_title?: string | null;
  story_description?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  created_at?: string;
}

/**
 * Baris `peduli_events` + foto terkait.
 * Kolom wajib DB: date_label, orphanage_name, location_city, headline, summary
 * ditandai optional di tipe hanya agar data placeholder/komersil lama tetap
 * ter-assign; server selalu menyediakannya.
 */
export interface ActivityEvent {
  id: string;
  slug?: string | null;
  title?: string | null;
  date_label?: string | null;
  location?: string | null;
  location_city?: string | null;
  orphanage_name?: string | null;
  orphanage_address?: string | null;
  address?: string | null;
  headline?: string | null;
  summary?: string | null;
  story?: string | null;
  impact_children?: number | null;
  impact_volunteers?: number | null;
  impact_days?: number | null;
  children_count?: number | null;
  volunteers_count?: number | null;
  packages_distributed?: number | null;
  legal_number?: string | null;
  head_name?: string | null;
  phone?: string | null;
  urgent_needs?: UrgentNeed[] | string[] | null;
  bank_accounts?: BankAccount[] | null;
  cover_image?: string | null;
  photos?: PolaroidPhoto[];
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}
