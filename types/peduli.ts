export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface UrgentNeed {
  title: string;
  amount: string | number;
  collected?: string | number;
}

export interface PolaroidPhoto {
  id: string;
  event_id?: string;
  image_url: string;
  src?: string;
  url?: string;
  note?: string | null;
  caption?: string | null;
  alt?: string | null;
  rotation_deg?: number | null;
  sort_order?: number | null;
  story_title?: string | null;
  story_description?: string | null;
  handwritten_note?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  created_at?: string;
}

export interface ActivityEvent {
  id: string;
  slug: string;
  title: string;
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
  urgent_needs?: UrgentNeed[] | null;
  bank_accounts?: BankAccount[] | null;
  cover_image?: string | null;
  photos?: PolaroidPhoto[];
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}
