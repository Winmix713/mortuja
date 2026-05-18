import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Component } from
'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GlowPreview } from '../components/glow-editor/GlowPreview';
import { LeftSidebar } from '../components/glow-editor/LeftSidebar';
import {
  RightSidebar,
  ExportModal } from
'../components/glow-editor/RightSidebar';
import {
  ABSplitView,
  ABSplitToggle } from
'../components/glow-editor/ABSplitView';
import { CommandPalette } from '../components/glow-editor/CommandPalette';
import { useHistory, usePresets } from '../hooks/use-glow-editor';
import { usePersistedState } from '../hooks/use-persisted-state';
import { exportAsCSS, debounce, INITIAL_STATE } from '../lib/glow-types';
import { generateRandomGlow } from '../lib/glow-utils';
import { buildShareUrl, getStateFromCurrentUrl } from '../lib/glow-share';
import type { GlowState } from '../lib/glow-types';
export default function Index() {
  const { state: currentState, setState: setCurrentState } = usePersistedState();
  const [cssOverride, setCssOverride] = useState<string | null>(null);
  const [showABSplit, setShowABSplit] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const history = useHistory(currentState);
  const presetManager = usePresets(INITIAL_STATE);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlState = getStateFromCurrentUrl();
    if (!urlState) return;
    setCurrentState(urlState);
    toast.success('Loaded shared glow effect!');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`
    );
  }, [setCurrentState]);
  const debouncedHistoryPush = useMemo(() => {
    const push = debounce((state: GlowState) => {
      history.pushState(state);
    }, 500);
    return push;
  }, [history]);
  useEffect(() => {
    return () => {
      if (
      debouncedHistoryPush &&
      typeof (
      debouncedHistoryPush as {
        cancel?: () => void;
      }).
      cancel === 'function')
      {
        ;(
        debouncedHistoryPush as {
          cancel: () => void;
        }).
        cancel();
      }
    };
  }, [debouncedHistoryPush]);
  const handleStateChange = useCallback(
    (newState: GlowState) => {
      setCurrentState(newState);
      setCssOverride(null);
      debouncedHistoryPush(newState);
    },
    [setCurrentState, debouncedHistoryPush]
  );
  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    if (!prevState) return;
    setCurrentState(prevState);
    setCssOverride(null);
  }, [history, setCurrentState]);
  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (!nextState) return;
    setCurrentState(nextState);
    setCssOverride(null);
  }, [history, setCurrentState]);
  const handleSavePreset = useCallback(
    (name: string) => {
      presetManager.savePreset(name, currentState);
      toast.success(`Preset "${name}" saved`);
    },
    [presetManager, currentState]
  );
  const handleOpenCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);
  const handleCloseCommandPalette = useCallback(() => {
    setShowCommandPalette(false);
  }, []);
  const handleOpenExport = useCallback(() => {
    setShowExportModal(true);
  }, []);
  const handleCloseExport = useCallback(() => {
    setShowExportModal(false);
  }, []);
  const handleToggleABSplit = useCallback(() => {
    setShowABSplit((prev) => !prev);
  }, []);
  const handleCloseABSplit = useCallback(() => {
    setShowABSplit(false);
  }, []);
  const handleShare = useCallback(async () => {
    const url = buildShareUrl(currentState);
    try {
      if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function')
      {
        await navigator.clipboard.writeText(url);
        toast.success('Share link copied to clipboard!');
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      if (typeof window !== 'undefined') {
        toast.info('Share URL generated - copy from address bar');
        window.location.hash = `s=${btoa(encodeURIComponent(JSON.stringify(currentState)))}`;
      }
    }
  }, [currentState]);
  const handleRandomize = useCallback(() => {
    const nextState = generateRandomGlow();
    handleStateChange(nextState);
    toast.success('Randomized!');
  }, [handleStateChange]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed) return;
      const key = event.key.toLowerCase();
      if (key === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
        return;
      }
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (key === 'y' || key === 'z' && event.shiftKey) {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);
  const activeCss = useMemo(() => {
    return cssOverride ?? exportAsCSS(currentState);
  }, [cssOverride, currentState]);
  const handlePowerChange = useCallback(
    (power: number) => {
      handleStateChange({
        ...currentState,
        power
      });
    },
    [currentState, handleStateChange]
  );
  const handleLayerSelect = useCallback(
    (id: string) => {
      handleStateChange({
        ...currentState,
        selectedLayerId: id
      });
    },
    [currentState, handleStateChange]
  );
  const handleExportFromPalette = useCallback(() => {
    setShowCommandPalette(false);
    setShowExportModal(true);
  }, []);
  return (
    <div className="h-screen editor-bg text-foreground font-sans selection:bg-primary/30 overflow-hidden flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: activeCss
        }} />
      

      <div className="flex-1 flex gap-2 p-2 min-h-0">
        <LeftSidebar
          state={currentState}
          onStateChange={handleStateChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onSavePreset={handleSavePreset}
          presetManager={presetManager}
          onOpenExport={handleOpenExport}
          onShare={handleShare}
          onOpenCommandPalette={handleOpenCommandPalette} />
        

        <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-2 p-2 relative group">
          <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[3rem] blur-3xl shadow-inner" />

          <AnimatePresence>
            {showABSplit &&
            <div className="w-full max-w-[1000px] mx-auto mb-4 z-40">
                <ABSplitView
                currentState={currentState}
                onClose={handleCloseABSplit} />
              
              </div>
            }
          </AnimatePresence>

          <div className="flex-1 min-h-0 relative bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden shadow-[inset_0_2px_24px_rgba(0,0,0,0.8),0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl group-canvas transition-all duration-700 hover:border-white/15">
            <div className="absolute top-6 left-6 flex items-center gap-3 z-50">
              <ABSplitToggle
                isOpen={showABSplit}
                onToggle={handleToggleABSplit} />
              

              <div className="h-px w-8 bg-white/10 hidden sm:block" />

              <button
                type="button"
                onClick={handleOpenCommandPalette}
                className="flex items-center gap-2 opacity-30 hover:opacity-80 transition-opacity">
                
                <kbd className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white tracking-widest uppercase">
                  ⌘K
                </kbd>
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                  Commands
                </span>
              </button>
            </div>

            <GlowPreview
              state={currentState}
              setPower={handlePowerChange}
              onStateChange={handleStateChange}
              onLayerSelect={handleLayerSelect}
              cssOverride={cssOverride} />
            
          </div>
        </div>

        <RightSidebar
          state={currentState}
          onStateChange={handleStateChange}
          cssOverride={cssOverride}
          setCssOverride={setCssOverride} />
        
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={handleCloseExport}
        state={currentState}
        cssOverride={cssOverride} />
      

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={handleCloseCommandPalette}
        state={currentState}
        onStateChange={handleStateChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExportFromPalette}
        onShare={handleShare}
        onRandomize={handleRandomize} />
      
    </div>);

}