"use client";

import type { ActivityEvent } from "@/types/peduli";
import { Building2, Phone, MapPin, HeartHandshake, MessageCircle } from "lucide-react";

type Props = {
  event: ActivityEvent;
};

/** Ikon Instagram — lucide-react tidak lagi mengekspor ikon brand. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const contactLinks = [
  {
    href: "https://instagram.com/yardysmarypmj",
    label: "@yardysmarypmj",
    external: true,
    icon: "instagram" as const,
    ariaLabel: "Buka Instagram resmi yayasan di tab baru",
  },
  {
    href: "https://wa.me/628121330777",
    label: "0812-1330-777",
    external: true,
    icon: "whatsapp" as const,
    ariaLabel: "Hubungi via WhatsApp 0812-1330-777 di tab baru",
  },
  {
    href: "https://wa.me/6281244440101",
    label: "0812-4444-0101",
    external: true,
    icon: "whatsapp" as const,
    ariaLabel: "Hubungi via WhatsApp 0812-4444-0101 di tab baru",
  },
  {
    href: "tel:+622517556161",
    label: "(0251) 755-6161",
    external: false,
    icon: "phone" as const,
    ariaLabel: "Telepon kantor yayasan (0251) 755-6161",
  },
];

export function OrphanageProfileCard({ event }: Props) {
  const urgentNeeds = (Array.isArray(event.urgent_needs) ? event.urgent_needs : [])
    .map((need) => (typeof need === "string" ? need : need.item || need.title || ""))
    .filter(Boolean);

  const address = event.address || event.orphanage_address;
  const location = event.location_city || event.location;

  return (
    <div className="bg-white border border-stone-200/90 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header Info */}
      <div className="border-b border-stone-100 pb-5">
        <div className="flex items-center gap-2 text-sky-800 font-semibold text-xs tracking-wider uppercase mb-1">
          <Building2 className="w-4 h-4 text-sky-700" aria-hidden="true" />
          <span>Transparansi Mitra Panti</span>
        </div>
        <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-slate-900">
          {event.orphanage_name}
        </h2>
        {location && <p className="text-sm text-stone-500 mt-1">{location}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-stone-600">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              {address || "Alamat panti akan ditampilkan setelah diverifikasi redaksi."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
            <p>{event.phone || "+62 812-8899-7711"}</p>
          </div>
          <div className="text-xs text-stone-500 pt-1">
            <span className="font-semibold text-stone-700">SK Legalitas:</span>{" "}
            {event.legal_number || "-"}
            {event.head_name && (
              <>
                {" \u00b7 "}
                <span className="font-semibold text-stone-700">Pengelola:</span> {event.head_name}
              </>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Kebutuhan Pokok yang Mendesak:
          </h4>
          {urgentNeeds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {urgentNeeds.map((need, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-stone-100 border border-stone-200/70 text-stone-700 text-xs font-medium"
                >
                  {need}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Belum ada daftar kebutuhan mendesak.</p>
          )}
        </div>
      </div>

      {/* Kanal Donasi & Kontak Langsung */}
      <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sky-950 font-medium text-sm">
          <HeartHandshake className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
          <span>Kanal Donasi &amp; Kontak Langsung Yayasan:</span>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          Bagi donatur atau masyarakat yang ingin menyalurkan santunan maupun bersilaturahmi
          dengan pihak yayasan, silakan menghubungi kami secara langsung melalui kanal resmi
          berikut:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contactLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              aria-label={link.ariaLabel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-sky-200/80 text-slate-800 text-sm font-medium hover:border-sky-400 hover:text-sky-700 hover:shadow-sm transition"
            >
              {link.icon === "instagram" && (
                <InstagramIcon className="w-4 h-4 text-rose-500" />
              )}
              {link.icon === "whatsapp" && (
                <MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              )}
              {link.icon === "phone" && (
                <Phone className="w-4 h-4 text-sky-700" aria-hidden="true" />
              )}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
