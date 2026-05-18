import React from 'react';
export function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-editor-surface/50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-destructive/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 text-center">
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/20 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="px-6 py-3 bg-editor-surface border border-editor-border text-foreground rounded-xl font-bold hover:bg-editor-surface-hover transition-all inline-block">
          
          Return Home
        </a>
      </div>
    </div>);

}