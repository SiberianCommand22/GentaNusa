"use client";

import { useState } from "react";
import type { ActivityEvent, BankAccount } from "@/types/peduli";
import { Building2, Phone, MapPin, Copy, Check, ShieldCheck, HeartHandshake } from "lucide-react";

type Props = {
  event: ActivityEvent;
};

/** Rekening cadangan bila admin belum mengisi kolom `bank_accounts`. */
const FALLBACK_ACCOUNT: BankAccount = {
  bank_name: "Bank Syariah Indonesia (BSI)",
  account_number: "7190028471",
  account_holder: "Yayasan Ar-Rakha",
};

export function OrphanageProfileCard({ event }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const bankAccounts =
    Array.isArray(event.bank_accounts) && event.bank_accounts.length > 0
      ? event.bank_accounts
      : [FALLBACK_ACCOUNT];

  const urgentNeeds = (Array.isArray(event.urgent_needs) ? event.urgent_needs : [])
    .map((need) => (typeof need === "string" ? need : need.item || need.title || ""))
    .filter(Boolean);

  const address = event.address || event.orphanage_address;
  const location = event.location_city || event.location;

  function handleCopy(num: string, idx: number) {
    navigator.clipboard
      .writeText(num)
      .then(() => {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2500);
      })
      .catch(() => {
        /* clipboard tidak tersedia — abaikan */
      });
  }

  return (
    <div className="bg-white border border-stone-200/90 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-800 font-semibold text-xs tracking-wider uppercase mb-1">
            <Building2 className="w-4 h-4 text-sky-700" aria-hidden="true" />
            <span>Transparansi Mitra Panti</span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-slate-900">
            {event.orphanage_name}
          </h2>
          {location && <p className="text-sm text-stone-500 mt-1">{location}</p>}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>Izin Terverifikasi Dinsos</span>
        </div>
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

      {/* Slip Rekening Donasi Mandiri */}
      <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sky-950 font-medium text-sm">
          <HeartHandshake className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
          <span>Penyaluran Donasi Langsung ke Panti (100% Tanpa Perantara Redaksi):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bankAccounts.map((bank, i) => (
            <div
              key={`${bank.bank_name}-${bank.account_number}`}
              className="bg-white border border-sky-200/60 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sky-900">{bank.bank_name}</p>
                <p className="text-lg font-mono font-bold text-slate-900 tracking-wider truncate">
                  {bank.account_number}
                </p>
                <p className="text-[11px] text-stone-500 truncate">a.n {bank.account_holder}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bank.account_number, i)}
                aria-label={`Salin nomor rekening ${bank.bank_name}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-white text-xs font-medium transition shadow-xs shrink-0"
              >
                {copiedIdx === i ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-500 italic">
          *100% donasi disalurkan langsung ke rekening resmi yayasan tanpa perantara/potongan
          redaksi.
        </p>
      </div>
    </div>
  );
}
