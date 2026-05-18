import React from 'react';
import { NavLink } from '../components/ui/NavLink';
import { Sparkles, Wand2, Code } from 'lucide-react';
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 text-center max-w-3xl px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>v2.0 is out now</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Design{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            radiant
          </span>{' '}
          interfaces.
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate visual editor for CSS glow effects. Create complex,
          multi-layered shadows and export them directly to your codebase.
        </p>

        <div className="flex items-center justify-center gap-4">
          <a
            href="/editor"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(168,255,80,0.4)] flex items-center gap-2">
            
            <Wand2 className="w-5 h-5" />
            Open Editor
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 bg-editor-surface border border-editor-border text-foreground rounded-2xl font-bold hover:bg-editor-surface-hover transition-all flex items-center gap-2">
            
            <Code className="w-5 h-5" />
            View Source
          </a>
        </div>
      </div>
    </div>);

}