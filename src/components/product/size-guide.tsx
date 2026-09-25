"use client";

import { useState } from "react";
import { Ruler, X } from "lucide-react";

const TABS = [
  { key: "tops", label: "Tops & Shirts" },
  { key: "bottoms", label: "Trousers & Shorts" },
  { key: "senator", label: "Senator & Agbada" },
  { key: "footwear", label: "Footwear" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CHART_DATA: Record<TabKey, { headers: string[]; rows: string[][] }> = {
  tops: {
    headers: ["Size", "Chest (in)", "Length (in)", "Sleeve (in)"],
    rows: [
      ["S", "36–38", "27", "24"],
      ["M", "39–41", "28", "24.5"],
      ["L", "42–44", "29", "25"],
      ["XL", "45–47", "30", "25.5"],
      ["XXL", "48–50", "31", "26"],
    ],
  },
  bottoms: {
    headers: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"],
    rows: [
      ["S", "30–32", "38–40", "30"],
      ["M", "33–35", "41–43", "30.5"],
      ["L", "36–38", "44–46", "31"],
      ["XL", "39–41", "47–49", "31.5"],
      ["XXL", "42–44", "50–52", "32"],
    ],
  },
  senator: {
    headers: ["Size", "Chest (in)", "Length (in)", "Shoulder (in)"],
    rows: [
      ["M", "39–41", "44", "18"],
      ["L", "42–44", "45", "18.5"],
      ["XL", "45–47", "46", "19"],
      ["XXL", "48–50", "47", "19.5"],
      ["XXXL", "51–53", "48", "20"],
    ],
  },
  footwear: {
    headers: ["UK Size", "EU Size", "Foot Length (cm)"],
    rows: [
      ["7", "41", "26"],
      ["8", "42", "27"],
      ["9", "43", "27.5"],
      ["10", "44", "28.5"],
      ["11", "45", "29.5"],
    ],
  },
};

export function SizeGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("tops");

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-navy/60 underline decoration-navy/30 underline-offset-2 hover:text-navy"
      >
        <Ruler className="h-4 w-4" />
        Size guide
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-navy">Size Guide</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-navy/50 hover:bg-navy/5 hover:text-navy"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-navy text-white"
                      : "bg-navy/5 text-navy/60 hover:bg-navy/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10">
                    {CHART_DATA[activeTab].headers.map((h) => (
                      <th key={h} className="pb-2 pr-4 font-medium text-navy/70">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHART_DATA[activeTab].rows.map((row) => (
                    <tr key={row[0]} className="border-b border-navy/5">
                      {row.map((cell, i) => (
                        <td key={i} className="py-2 pr-4 text-navy">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-navy/50">
              Measurements are approximate. For a custom fit, message us on WhatsApp with your measurements.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
