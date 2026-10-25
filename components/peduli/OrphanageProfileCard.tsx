"use client";

import { useState } from "react";
import type { ActivityEvent, BankAccount } from "@/types/peduli";

type Props = {
  event: ActivityEvent;
};

export function OrphanageProfileCard({ event }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const bankAccounts = Array.isArray(event.bank_accounts) ? event.bank_accounts : [];

  function copyAccount(acc: BankAccount) {
    navigator.clipboard.writeText(acc.account_number).then(() => {
      setCopied(acc.account_number);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const address = event.address || event.orphanage_address;
  const location = event.location_city || event.location;
  const children = event.children_count ?? event.impact_children;
  const volunteers = event.volunteers_count ?? event.impact_volunteers;
  const packages = event.packages_distributed ?? event.impact_days;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-sky-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
        <h2 className="text-2xl font-bold text-white mb-2">{event.orphanage_name}</h2>
        {location && <p className="text-slate-300 mb-4">{location}</p>}
        {address && <p className="text-sm text-slate-400 mb-4">{address}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {children != null && (
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-400">{children}</div>
              <div className="text-xs text-slate-400">Anak Asuh</div>
            </div>
          )}
          {volunteers != null && (
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-400">{volunteers}</div>
              <div className="text-xs text-slate-400">Relawan</div>
            </div>
          )}
          {packages != null && (
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-400">{packages}</div>
              <div className="text-xs text-slate-400">Paket Dibagikan</div>
            </div>
          )}
        </div>
        {bankAccounts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Rekening Donasi</h3>
            <div className="space-y-2">
              {bankAccounts.map((acc, i) => (
                <button
                  key={i}
                  onClick={() => copyAccount(acc)}
                  className="w-full flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div>
                    <div className="text-white font-medium">{acc.bank_name}</div>
                    <div className="text-sky-300 font-mono">{acc.account_number}</div>
                    <div className="text-xs text-slate-400">a.n. {acc.account_holder}</div>
                  </div>
                  <span className="text-xs text-sky-400">{copied === acc.account_number ? "Tersalin!" : "Salin Nomor Rekening"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-400 italic">
          *100% donasi disalurkan langsung ke rekening resmi yayasan tanpa perantara/potongan redaksi
        </p>
      </div>
    </div>
  );
}
