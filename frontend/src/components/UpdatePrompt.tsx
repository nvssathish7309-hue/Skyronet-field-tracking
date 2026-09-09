import React, { useState } from 'react';
import { RefreshCw, X, Wifi } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate, onDismiss }) => {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = () => {
    setUpdating(true);
    onUpdate();
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div className="relative bg-slate-900 text-white rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/60 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600" />

        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mt-0.5">
            <Wifi className="w-4 h-4 text-blue-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-white leading-tight">
              New Update Available
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-snug">
              A new version of the Skyronet app is ready. Tap update to get the latest features.
            </p>

            {/* Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white text-[11px] font-black rounded-lg transition-all active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${updating ? 'animate-spin' : ''}`} />
                {updating ? 'Updating...' : 'Update Now'}
              </button>
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-bold rounded-lg transition-all active:scale-95"
              >
                Later
              </button>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
