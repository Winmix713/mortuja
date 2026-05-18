import React from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  ZoomOut,
  ZoomIn,
  Maximize,
  Grid,
  Layers,
  Download,
  Columns,
  Terminal } from
'lucide-react';
import { GlowState } from '../../lib/glow-types';
export function CenterCanvas({ state }: {state: GlowState;}) {
  const glowStyle = state.power ?
  {
    boxShadow: state.layers.
    filter((l) => l.active).
    map((l) => `0 0 ${l.blur}px ${l.color}`).
    join(', ')
  } :
  {};
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-2 relative">
      {/* Canvas Container */}
      <div className="flex-1 min-h-0 relative bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden canvas-inset-shadow backdrop-blur-xl">
        {/* Top Overlay Bar */}
        <div className="absolute top-6 left-6 flex items-center gap-3 z-50">
          <button className="toolbar-btn bg-white/5 border border-white/10">
            <Columns className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <div className="w-2 h-px bg-white/20" />
            <div className="w-2 h-px bg-white/20" />
            <div className="w-2 h-px bg-white/20" />
            <div className="w-2 h-px bg-white/20" />
          </div>
          <button className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity">
            <Terminal className="w-4 h-4 text-white" />
            <span className="text-[10px] text-white font-semibold uppercase tracking-wider">
              Commands
            </span>
          </button>
        </div>

        {/* Floating Toolbar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
          {/* Device Frames */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl rounded-xl p-1.5 border border-white/10">
            <button className="toolbar-btn active">
              <Smartphone className="w-4 h-4" />
            </button>
            <button className="toolbar-btn">
              <Tablet className="w-4 h-4" />
            </button>
            <button className="toolbar-btn">
              <Monitor className="w-4 h-4" />
            </button>
            <button className="toolbar-btn">
              <Tv className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl rounded-xl p-1.5 border border-white/10">
            <button className="toolbar-btn">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-white/60 font-medium">100%</span>
            <button className="toolbar-btn">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl rounded-xl p-1.5 border border-white/10">
            <button className="toolbar-btn">
              <Maximize className="w-4 h-4" />
            </button>
            <button className="toolbar-btn">
              <Grid className="w-4 h-4" />
            </button>
            <button className="toolbar-btn">
              <Layers className="w-4 h-4" />
            </button>
            <button className="toolbar-btn text-green-500">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Glow Preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="glow-preview-card w-[280px] h-[360px] shadow-2xl transition-all duration-300"
            style={glowStyle}>
            
            <div className="glow-effect" />
            <div className="absolute inset-0 rounded-[1.5rem] border border-white/5" />
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] text-white/40 font-medium">
              120×400
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-medium">
            {state.layers.length} LAYERS
          </span>
          <div className="flex items-center gap-2">
            <svg
              className="w-3 h-3 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              
            </svg>
            <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">
              {state.layers.find((l) => l.id === state.selectedLayerId)?.name ||
              'None'}
            </span>
          </div>
        </div>
      </div>
    </div>);

}