'use client';

import { HeatmapData } from '@/types';

interface HeatmapMockProps {
  heatmap?: HeatmapData | null;
}

export default function HeatmapMock({ heatmap }: HeatmapMockProps) {
  if (!heatmap) {
    return null;
  }

  const width = Math.max(1, heatmap.width);
  const height = Math.max(1, heatmap.height);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Visual Explainability (Mock Heatmap)</h3>

      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />

        {heatmap.regions.map((region) => {
          const left = `${(region.x / width) * 100}%`;
          const top = `${(region.y / height) * 100}%`;
          const w = `${(region.w / width) * 100}%`;
          const h = `${(region.h / height) * 100}%`;

          return (
            <div
              key={region.id}
              className="absolute border-2 border-rose-300 bg-rose-500/30 rounded"
              style={{ left, top, width: w, height: h }}
              title={`${region.label} (${Math.round(region.intensity * 100)}%)`}
            />
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-3">{heatmap.note}</p>
    </div>
  );
}
