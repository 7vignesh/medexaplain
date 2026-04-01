'use client';

interface AiThinkingCardProps {
  status: 'pending' | 'processing';
}

export default function AiThinkingCard({ status }: AiThinkingCardProps) {
  return (
    <div className="bg-gradient-to-r from-sky-950/40 via-cyan-950/35 to-emerald-950/35 border border-cyan-800/40 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 rounded-full border-4 border-cyan-800/50" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-600 animate-spin" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-cyan-200">AI thinking...</h3>
          <p className="text-sm text-cyan-300">
            Pipeline status: {status}. Running observation, pattern mapping, diagnosis, and confidence calibration.
          </p>
        </div>
      </div>
    </div>
  );
}
