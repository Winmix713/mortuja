import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Undo2,
  Redo2,
  Shuffle,
  Download,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Layers,
  Zap,
  ZapOff,
  Sparkles,
  Share2,
  Palette,
  Code,
  Settings2,
  Copy,
  Trash2,
  Plus } from
'lucide-react';
import { cn } from '../../lib/utils';
import type { GlowState } from '../../lib/glow-types';
import { BUILT_IN_PRESETS } from '../../lib/glow-presets';
interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'action' | 'layer' | 'preset' | 'navigation';
  shortcut?: string;
  action: () => void;
}
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  state: GlowState;
  onStateChange: (s: GlowState) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onShare: () => void;
  onRandomize: () => void;
}
export function CommandPalette({
  isOpen,
  onClose,
  state,
  onStateChange,
  onUndo,
  onRedo,
  onExport,
  onShare,
  onRandomize
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const actions: CommandAction[] = useMemo(() => {
    const items: CommandAction[] = [
    {
      id: 'undo',
      label: 'Undo',
      icon: <Undo2 className="w-4 h-4" />,
      category: 'action',
      shortcut: '⌘Z',
      action: () => {
        onUndo();
        onClose();
      }
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: <Redo2 className="w-4 h-4" />,
      category: 'action',
      shortcut: '⌘⇧Z',
      action: () => {
        onRedo();
        onClose();
      }
    },
    {
      id: 'export',
      label: 'Export Code',
      description: 'CSS, Tailwind, React',
      icon: <Download className="w-4 h-4" />,
      category: 'action',
      shortcut: '⌘⇧E',
      action: () => {
        onExport();
        onClose();
      }
    },
    {
      id: 'share',
      label: 'Share Link',
      description: 'Copy shareable URL',
      icon: <Share2 className="w-4 h-4" />,
      category: 'action',
      action: () => {
        onShare();
        onClose();
      }
    },
    {
      id: 'randomize',
      label: 'Randomize',
      description: 'Generate random glow',
      icon: <Shuffle className="w-4 h-4" />,
      category: 'action',
      action: () => {
        onRandomize();
        onClose();
      }
    },
    {
      id: 'toggle-power',
      label: state.power ? 'Disable Effects' : 'Enable Effects',
      icon: state.power ?
      <ZapOff className="w-4 h-4" /> :

      <Zap className="w-4 h-4" />,

      category: 'action',
      action: () => {
        onStateChange({
          ...state,
          power: !state.power
        });
        onClose();
      }
    },
    {
      id: 'toggle-theme',
      label:
      state.themeMode === 'dark' ? 'Switch to Light' : 'Switch to Dark',
      icon:
      state.themeMode === 'dark' ?
      <Sun className="w-4 h-4" /> :

      <Moon className="w-4 h-4" />,

      category: 'action',
      action: () => {
        onStateChange({
          ...state,
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark'
        });
        onClose();
      }
    },
    {
      id: 'toggle-noise',
      label: state.noiseEnabled ? 'Disable Noise' : 'Enable Noise',
      icon: <Sparkles className="w-4 h-4" />,
      category: 'action',
      action: () => {
        onStateChange({
          ...state,
          noiseEnabled: !state.noiseEnabled
        });
        onClose();
      }
    },
    {
      id: 'add-layer',
      label: 'Add New Layer',
      icon: <Plus className="w-4 h-4" />,
      category: 'action',
      action: () => {
        const nl = {
          id: `layer-${Date.now()}`,
          name: 'New Layer',
          active: true,
          color: '#ffffff',
          blur: 50,
          opacity: 0.5,
          width: 200,
          height: 200,
          x: 0,
          y: 0,
          blendMode: 'screen' as const
        };
        onStateChange({
          ...state,
          layers: [...state.layers, nl],
          selectedLayerId: nl.id
        });
        onClose();
      }
    },
    ...state.layers.map((layer) => ({
      id: `layer-${layer.id}`,
      label: layer.name,
      description: `${layer.color} · ${layer.active ? 'visible' : 'hidden'}`,
      icon:
      <div
        className="w-4 h-4 rounded-full border border-white/20"
        style={{
          backgroundColor: layer.color
        }} />,


      category: 'layer' as const,
      action: () => {
        onStateChange({
          ...state,
          selectedLayerId: layer.id
        });
        onClose();
      }
    })),
    ...BUILT_IN_PRESETS.map((preset) => ({
      id: `preset-${preset.id}`,
      label: `${preset.emoji} ${preset.name}`,
      description: `${preset.state.layers.length} layers`,
      icon: <Palette className="w-4 h-4" />,
      category: 'preset' as const,
      action: () => {
        onStateChange(preset.state);
        onClose();
      }
    }))];

    return items;
  }, [
  state,
  onStateChange,
  onUndo,
  onRedo,
  onExport,
  onShare,
  onRandomize,
  onClose]
  );
  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
      a.label.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.category.includes(q)
    );
  }, [actions, query]);
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose]
  );
  const grouped = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);
  const categoryLabels: Record<string, string> = {
    action: 'Actions',
    layer: 'Layers',
    preset: 'Presets',
    navigation: 'Navigation'
  };
  let globalIndex = -1;
  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        transition={{
          duration: 0.15
        }}
        className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]"
        onClick={onClose}>
        
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
          initial={{
            scale: 0.95,
            opacity: 0,
            y: -20
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0
          }}
          exit={{
            scale: 0.95,
            opacity: 0,
            y: -10
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35
          }}
          className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          style={{
            background:
            'linear-gradient(180deg, rgba(20,20,24,0.98) 0%, rgba(12,12,16,0.99) 100%)'
          }}
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
              <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, layers, presets..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25 font-medium"
              autoFocus />
            
              <kbd className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/30 tracking-widest">
                ESC
              </kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar py-2">
              {filtered.length === 0 ?
            <div className="py-12 text-center">
                  <p className="text-sm text-white/30 font-medium">
                    No results found
                  </p>
                  <p className="text-xs text-white/15 mt-1">
                    Try a different search term
                  </p>
                </div> :

            Object.entries(grouped).map(([category, items]) =>
            <div key={category}>
                    <div className="px-5 py-2">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em]">
                        {categoryLabels[category] || category}
                      </span>
                    </div>
                    {items.map((item) => {
                globalIndex++;
                const idx = globalIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all',
                      idx === selectedIndex ?
                      'bg-white/[0.06]' :
                      'hover:bg-white/[0.03]'
                    )}>
                    
                          <span
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        idx === selectedIndex ?
                        'text-primary' :
                        'text-white/40'
                      )}>
                      
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span
                        className={cn(
                          'text-[13px] font-semibold block truncate transition-colors',
                          idx === selectedIndex ?
                          'text-white' :
                          'text-white/70'
                        )}>
                        
                              {item.label}
                            </span>
                            {item.description &&
                      <span className="text-[10px] text-white/25 block truncate">
                                {item.description}
                              </span>
                      }
                          </div>
                          {item.shortcut &&
                    <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-white/25 tracking-wider flex-shrink-0">
                              {item.shortcut}
                            </kbd>
                    }
                          {idx === selectedIndex &&
                    <span className="text-[9px] text-white/20 font-bold flex-shrink-0">
                              ↵
                            </span>
                    }
                        </button>);

              })}
                  </div>
            )
            }
            </div>
            <div className="flex items-center gap-4 px-5 py-3 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-[9px] text-white/20 font-bold">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/20 font-bold">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  ↵
                </kbd>{' '}
                Select
              </span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/20 font-bold">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  ESC
                </kbd>{' '}
                Close
              </span>
              <span className="flex-1" />
              <span className="text-[9px] text-white/15 font-bold">
                {filtered.length} results
              </span>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}