import React, { useCallback, useState, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Shuffle,
  CopyPlus,
  Star,
  Search,
  Code,
  ChevronDown,
  GripVertical,
  Share2,
  Command,
  FolderPlus,
  Clipboard,
  ClipboardPaste,
  ChevronRight } from
'lucide-react';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'../ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from
'../ui/collapsible';
import { toast } from 'sonner';
import type {
  GlowState,
  GlowLayer,
  LayerGroup,
  CopiedLayerStyle } from
'../../lib/glow-types';
import { BUILT_IN_PRESETS, PRESET_CATEGORIES } from '../../lib/glow-presets';
import { duplicateLayer, generateRandomGlow } from '../../lib/glow-utils';
const GLOW = {
  primary: '#A8FF50',
  primaryDim: 'rgba(168,255,80,0.14)',
  primaryTint: 'rgba(168,255,80,0.07)',
  primaryGlow: 'rgba(168,255,80,0.28)',
  primaryRing: 'rgba(168,255,80,0.30)'
};
function MiniPresetPreview({ state }: {state: GlowState;}) {
  const colors = state.layers.
  filter((l) => l.active).
  slice(0, 4).
  map((l) => l.color);
  return (
    <div className="w-9 h-7 rounded-lg overflow-hidden relative border border-border bg-background flex-shrink-0">
      {colors.map((c, i) =>
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          backgroundColor: c,
          width: '55%',
          height: '55%',
          top: `${10 + i * 8}%`,
          left: `${10 + i * 12}%`,
          filter: 'blur(3px)',
          opacity: 0.7
        }} />

      )}
    </div>);

}
function LayerManager({
  layers,
  selectedId,
  onSelect,
  onUpdate,
  onAdd,
  onRemove,
  onDuplicate,
  groups,
  onGroupsChange,
  selectedGroupId,
  onSelectGroup,
  copiedStyle,
  onCopyStyle,
  onPasteStyle















}: {layers: GlowLayer[];selectedId: string | null;onSelect: (id: string) => void;onUpdate: (layers: GlowLayer[]) => void;onAdd: () => void;onRemove: (id: string) => void;onDuplicate: (id: string) => void;groups: LayerGroup[];onGroupsChange: (groups: LayerGroup[]) => void;selectedGroupId: string | null;onSelectGroup: (id: string | null) => void;copiedStyle: CopiedLayerStyle | null;onCopyStyle: (layer: GlowLayer) => void;onPasteStyle: (layerId: string) => void;}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const toggleVis = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(
      layers.map((l) =>
      l.id === id ?
      {
        ...l,
        active: !l.active
      } :
      l
      )
    );
  };
  const startEditing = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };
  const saveName = (id: string) => {
    if (editName.trim()) {
      onUpdate(
        layers.map((l) =>
        l.id === id ?
        {
          ...l,
          name: editName.trim()
        } :
        l
        )
      );
    }
    setEditingId(null);
  };
  const displayLayers = [...layers].reverse();
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (e.currentTarget instanceof HTMLElement)
    e.currentTarget.style.opacity = '0.5';
  }, []);
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement)
    e.currentTarget.style.opacity = '1';
    setDragId(null);
    setDragOverId(null);
  }, []);
  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (id !== dragId) setDragOverId(id);
    },
    [dragId]
  );
  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setDragOverId(null);
        return;
      }
      const fromIdx = layers.findIndex((l) => l.id === dragId);
      const toDisplayIdx = displayLayers.findIndex((l) => l.id === targetId);
      const toIdx = layers.length - 1 - toDisplayIdx;
      if (fromIdx === -1 || toIdx === -1) return;
      const nl = [...layers];
      const [moved] = nl.splice(fromIdx, 1);
      nl.splice(toIdx, 0, moved);
      onUpdate(nl);
      setDragId(null);
      setDragOverId(null);
    },
    [dragId, layers, displayLayers, onUpdate]
  );
  const handleCreateGroup = () => {
    const newGroup: LayerGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      active: true,
      opacity: 1,
      blendMode: 'normal',
      collapsed: false
    };
    onGroupsChange([...groups, newGroup]);
    if (selectedId) {
      onUpdate(
        layers.map((l) =>
        l.id === selectedId ?
        {
          ...l,
          groupId: newGroup.id
        } :
        l
        )
      );
    }
    onSelectGroup(newGroup.id);
    toast.success('Group created');
  };
  const handleAssignToGroup = (
  layerId: string,
  groupId: string | undefined) =>
  {
    onUpdate(
      layers.map((l) =>
      l.id === layerId ?
      {
        ...l,
        groupId
      } :
      l
      )
    );
  };
  const handleDeleteGroup = (groupId: string) => {
    onGroupsChange(groups.filter((g) => g.id !== groupId));
    onUpdate(
      layers.map((l) =>
      l.groupId === groupId ?
      {
        ...l,
        groupId: undefined
      } :
      l
      )
    );
    if (selectedGroupId === groupId) onSelectGroup(null);
    toast.success('Group removed');
  };
  const handleToggleGroupVis = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onGroupsChange(
      groups.map((g) =>
      g.id === groupId ?
      {
        ...g,
        active: !g.active
      } :
      g
      )
    );
  };
  const handleToggleGroupCollapse = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onGroupsChange(
      groups.map((g) =>
      g.id === groupId ?
      {
        ...g,
        collapsed: !g.collapsed
      } :
      g
      )
    );
  };
  const ungroupedLayers = displayLayers.filter((l) => !l.groupId);
  const groupedLayersByGroup = groups.map((g) => ({
    group: g,
    layers: displayLayers.filter((l) => l.groupId === g.id)
  }));
  const renderLayerItem = (layer: GlowLayer) =>
  <motion.div
    key={layer.id}
    layout
    initial={{
      opacity: 0,
      scale: 0.95,
      y: -6
    }}
    animate={{
      opacity: 1,
      scale: 1,
      y: 0
    }}
    exit={{
      opacity: 0,
      scale: 0.95,
      x: -16
    }}
    transition={{
      type: 'spring',
      stiffness: 500,
      damping: 30
    }}
    draggable
    onDragStart={(e) =>
    handleDragStart(e as unknown as React.DragEvent, layer.id)
    }
    onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
    onDragOver={(e) =>
    handleDragOver(e as unknown as React.DragEvent, layer.id)
    }
    onDrop={(e) => handleDrop(e as unknown as React.DragEvent, layer.id)}
    onClick={() => onSelect(layer.id)}
    className={cn(
      'group flex items-center gap-1.5 p-2 rounded-xl text-xs cursor-pointer border transition-all',
      selectedId === layer.id ?
      'bg-secondary border-border text-foreground shadow-sm' :
      'bg-transparent border-transparent hover:bg-muted hover:border-border text-muted-foreground',
      dragOverId === layer.id &&
      dragId !== layer.id &&
      'border-primary/50 bg-primary/5'
    )}>
    
      <motion.div
      className="w-0.5 h-5 rounded-full flex-shrink-0"
      style={{
        backgroundColor: GLOW.primary
      }}
      initial={false}
      animate={{
        opacity: selectedId === layer.id ? 1 : 0,
        scaleY: selectedId === layer.id ? 1 : 0
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30
      }} />
    
      <div
      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      onMouseDown={(e) => e.stopPropagation()}>
      
        <GripVertical className="w-3 h-3" />
      </div>
      <button
      onClick={(e) => toggleVis(layer.id, e)}
      className="text-muted-foreground hover:text-foreground transition-colors">
      
        {layer.active ?
      <Eye className="w-3 h-3" /> :

      <EyeOff className="w-3 h-3" />
      }
      </button>
      <motion.div
      className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-border"
      style={{
        backgroundColor: layer.color
      }}
      layoutId={`lc-${layer.id}`} />
    
      {editingId === layer.id ?
    <input
      type="text"
      value={editName}
      onChange={(e) => setEditName(e.target.value)}
      onBlur={() => saveName(layer.id)}
      onKeyDown={(e) => e.key === 'Enter' && saveName(layer.id)}
      className="flex-1 bg-black/40 border-none outline-none text-[11px] font-bold text-white px-1 rounded"
      autoFocus /> :


    <span
      className="flex-1 text-[11px] font-medium truncate"
      onDoubleClick={(e) => startEditing(layer.id, layer.name, e)}>
      
          {layer.name}
        </span>
    }
      {layer.clipMask?.imageUrl &&
    <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold">
          MASK
        </span>
    }
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
        onClick={(e) => {
          e.stopPropagation();
          onCopyStyle(layer);
        }}
        className="p-0.5 rounded transition-colors text-muted-foreground hover:text-primary"
        title="Copy Style">
        
          <Clipboard className="w-2.5 h-2.5" />
        </button>
        {copiedStyle &&
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPasteStyle(layer.id);
        }}
        className="p-0.5 rounded transition-colors text-muted-foreground hover:text-primary"
        title="Paste Style">
        
            <ClipboardPaste className="w-2.5 h-2.5" />
          </button>
      }
        <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate(layer.id);
        }}
        className="p-0.5 rounded transition-colors text-muted-foreground hover:text-primary">
        
          <CopyPlus className="w-2.5 h-2.5" />
        </button>
        <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(layer.id);
        }}
        className="p-0.5 rounded hover:text-destructive text-muted-foreground transition-colors">
        
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </motion.div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3 h-3" /> Layers{' '}
          <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {layers.length}
          </span>
        </span>
        <div className="flex items-center gap-0.5">
          <motion.button
            onClick={handleCreateGroup}
            whileHover={{
              scale: 1.1
            }}
            whileTap={{
              scale: 0.9
            }}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="New Group">
            
            <FolderPlus className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            onClick={onAdd}
            whileHover={{
              scale: 1.1
            }}
            whileTap={{
              scale: 0.9
            }}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
            
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
      <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
        {groupedLayersByGroup.map(({ group, layers: groupLayers }) =>
        <div key={group.id} className="space-y-0.5">
            <motion.div
            onClick={() =>
            onSelectGroup(selectedGroupId === group.id ? null : group.id)
            }
            className={cn(
              'flex items-center gap-1.5 p-2 rounded-xl text-xs cursor-pointer border transition-all',
              selectedGroupId === group.id ?
              'bg-primary/10 border-primary/30 text-foreground' :
              'bg-muted/50 border-border hover:border-border text-muted-foreground'
            )}>
            
              <button
              onClick={(e) => handleToggleGroupCollapse(group.id, e)}
              className="text-muted-foreground hover:text-foreground transition-colors">
              
                <motion.div
                animate={{
                  rotate: group.collapsed ? 0 : 90
                }}
                transition={{
                  duration: 0.15
                }}>
                
                  <ChevronRight className="w-3 h-3" />
                </motion.div>
              </button>
              <button
              onClick={(e) => handleToggleGroupVis(group.id, e)}
              className="text-muted-foreground hover:text-foreground transition-colors">
              
                {group.active ?
              <Eye className="w-3 h-3" /> :

              <EyeOff className="w-3 h-3" />
              }
              </button>
              <FolderOpen className="w-3 h-3 text-primary/60" />
              <span className="flex-1 text-[11px] font-bold truncate">
                {group.name}
              </span>
              <span className="text-[8px] font-mono text-muted-foreground">
                {groupLayers.length}
              </span>
              <span className="text-[8px] font-mono text-muted-foreground">
                {Math.round(group.opacity * 100)}%
              </span>
              <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(group.id);
              }}
              className="p-0.5 rounded hover:text-destructive text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
              
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </motion.div>
            <AnimatePresence>
              {selectedGroupId === group.id &&
            <motion.div
              initial={{
                height: 0,
                opacity: 0
              }}
              animate={{
                height: 'auto',
                opacity: 1
              }}
              exit={{
                height: 0,
                opacity: 0
              }}
              className="overflow-hidden">
              
                  <div className="pl-6 pr-2 py-2 space-y-2 bg-primary/5 rounded-lg border border-primary/10 mx-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-white/50 uppercase w-14">
                        Opacity
                      </span>
                      <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={group.opacity}
                    onChange={(e) =>
                    onGroupsChange(
                      groups.map((g) =>
                      g.id === group.id ?
                      {
                        ...g,
                        opacity: parseFloat(e.target.value)
                      } :
                      g
                      )
                    )
                    }
                    className="flex-1 h-1 accent-primary" />
                  
                      <span className="text-[9px] font-mono text-white/40 w-8 text-right">
                        {Math.round(group.opacity * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-white/50 uppercase w-14">
                        Blend
                      </span>
                      <select
                    value={group.blendMode}
                    onChange={(e) =>
                    onGroupsChange(
                      groups.map((g) =>
                      g.id === group.id ?
                      {
                        ...g,
                        blendMode: e.target.value as any
                      } :
                      g
                      )
                    )
                    }
                    className="flex-1 text-[9px] bg-black/30 border border-white/10 rounded px-1 py-0.5 text-white outline-none">
                    
                        {[
                    'normal',
                    'screen',
                    'overlay',
                    'soft-light',
                    'color-dodge',
                    'multiply'].
                    map((m) =>
                    <option key={m} value={m}>
                            {m}
                          </option>
                    )}
                      </select>
                    </div>
                  </div>
                </motion.div>
            }
            </AnimatePresence>
            {!group.collapsed &&
          <div className="pl-4 space-y-0.5">
                <AnimatePresence mode="popLayout">
                  {groupLayers.map(renderLayerItem)}
                </AnimatePresence>
              </div>
          }
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {ungroupedLayers.map(renderLayerItem)}
        </AnimatePresence>
      </div>
      {selectedId && groups.length > 0 &&
      <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">
            Group:
          </span>
          <button
          onClick={() => handleAssignToGroup(selectedId, undefined)}
          className={cn(
            'px-1.5 py-0.5 text-[8px] rounded border transition-all',
            !layers.find((l) => l.id === selectedId)?.groupId ?
            'bg-primary/10 border-primary/30 text-primary' :
            'border-border text-muted-foreground hover:text-white'
          )}>
          
            None
          </button>
          {groups.map((g) =>
        <button
          key={g.id}
          onClick={() => handleAssignToGroup(selectedId, g.id)}
          className={cn(
            'px-1.5 py-0.5 text-[8px] rounded border transition-all',
            layers.find((l) => l.id === selectedId)?.groupId === g.id ?
            'bg-primary/10 border-primary/30 text-primary' :
            'border-border text-muted-foreground hover:text-white'
          )}>
          
              {g.name}
            </button>
        )}
        </div>
      }
    </div>);

}
function TemplateBrowser({ onLoad }: {onLoad: (s: GlowState) => void;}) {
  const [cat, setCat] = useState('all');
  const filtered =
  cat === 'all' ?
  BUILT_IN_PRESETS :
  BUILT_IN_PRESETS.filter((p) => p.categoryId === cat);
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" /> Templates
      </span>
      <div className="flex gap-1 flex-wrap">
        {[
        {
          id: 'all',
          name: 'All',
          emoji: ''
        },
        ...PRESET_CATEGORIES].
        map((c) =>
        <button
          key={c.id}
          onClick={() => setCat(c.id)}
          className={cn(
            'px-2 py-0.5 text-[9px] font-medium rounded-md border transition-all',
            cat === c.id ?
            'bg-secondary border-border text-foreground' :
            'border-border text-muted-foreground hover:text-foreground hover:border-border'
          )}>
          
            {c.emoji} {c.name}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-0.5">
        <AnimatePresence mode="popLayout">
          {filtered.map((bp) =>
          <motion.button
            key={bp.id}
            layout
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.9
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25
            }}
            whileHover={{
              scale: 1.04,
              y: -1
            }}
            whileTap={{
              scale: 0.96
            }}
            onClick={() => {
              onLoad(bp.state);
              toast.success(`Loaded "${bp.name}"`);
            }}
            className="py-2 px-1.5 bg-muted/50 hover:bg-muted border border-border hover:border-border rounded-lg text-[9px] font-medium text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-1">
            
              <MiniPresetPreview state={bp.state} />
              <span className="truncate w-full text-center">
                {bp.emoji} {bp.name}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>);

}
function PresetManagerUI({
  presets,
  onLoad,
  onDelete,
  onToggleFavorite,
  onExport,
  onImport
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = presets.filter((p: any) =>
  p.name.toLowerCase().includes(search.toLowerCase())
  );
  const favs = filtered.filter((p: any) => p.favorite);
  const rest = filtered.filter((p: any) => !p.favorite);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors pt-1">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="w-3 h-3" /> My Presets ({presets.length})
          </span>
          <motion.span
            animate={{
              rotate: isOpen ? 180 : 0
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}>
            
            <ChevronDown className="w-3 h-3" />
          </motion.span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{
            opacity: 0,
            y: -6
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.15
          }}
          className="mt-2 space-y-2">
          
          {presets.length > 3 &&
          <div className="relative rounded-lg">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground" />
              <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-6 pr-2 py-1.5 text-[10px] bg-muted border border-border rounded-lg text-foreground outline-none transition-colors focus:border-primary/40" />
            
            </div>
          }
          <div className="flex gap-1.5">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-1.5 text-[9px] font-medium bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-border transition-all">
              
              Import
            </button>
            <button
              onClick={onExport}
              className="flex-1 py-1.5 text-[9px] font-medium bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-border transition-all">
              
              Export
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) onImport(e.target.files[0]);
              e.target.value = '';
            }}
            className="hidden" />
          
          <div className="max-h-[140px] overflow-y-auto space-y-0.5 custom-scrollbar">
            {favs.length > 0 &&
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-semibold">
                Favorites
              </span>
            }
            {[...favs, ...rest].map((p: any) =>
            <motion.div
              key={p.id}
              initial={{
                opacity: 0,
                x: -8
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-transparent hover:border-border group transition-all">
              
                <MiniPresetPreview state={p.state} />
                <span className="flex-1 text-[10px] text-foreground/80 font-medium truncate">
                  {p.name}
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                  onClick={() => onToggleFavorite(p.id)}
                  className={cn(
                    'p-0.5 transition-colors rounded',
                    p.favorite ?
                    'text-amber-400' :
                    'hover:text-amber-400 text-muted-foreground'
                  )}>
                  
                    <Star
                    className="w-2.5 h-2.5"
                    fill={p.favorite ? 'currentColor' : 'none'} />
                  
                  </button>
                  <button
                  onClick={() => onLoad(p.id)}
                  className="p-0.5 hover:text-foreground text-muted-foreground rounded">
                  
                    <FolderOpen className="w-2.5 h-2.5" />
                  </button>
                  <button
                  onClick={() => onDelete(p.id)}
                  className="p-0.5 hover:text-destructive text-muted-foreground rounded">
                  
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>);

}
interface LeftSidebarProps {
  state: GlowState;
  onStateChange: (s: GlowState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSavePreset: (name: string) => void;
  presetManager: any;
  onOpenExport: () => void;
  onShare?: () => void;
  onOpenCommandPalette?: () => void;
}
export function LeftSidebar({
  state,
  onStateChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSavePreset,
  presetManager,
  onOpenExport,
  onShare,
  onOpenCommandPalette
}: LeftSidebarProps) {
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [exportState, setExportState] = useState<
    'idle' | 'loading' | 'success'>(
    'idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [randomSpin, setRandomSpin] = useState(false);
  const handleCopyStyle = useCallback(
    (layer: GlowLayer) => {
      const style: CopiedLayerStyle = {
        color: layer.color,
        blur: layer.blur,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        gradient: layer.gradient,
        gradientAngle: layer.gradientAngle,
        gradientStops: layer.gradientStops,
        clipMask: layer.clipMask
      };
      updateState({
        copiedStyle: style
      });
      toast.success('Style copied!');
    },
    [state]
  );
  const handlePasteStyle = useCallback(
    (layerId: string) => {
      const style = state.copiedStyle;
      if (!style) return;
      updateState({
        layers: state.layers.map((l) =>
        l.id === layerId ?
        {
          ...l,
          color: style.color,
          blur: style.blur,
          opacity: style.opacity,
          blendMode: style.blendMode,
          gradient: style.gradient,
          gradientAngle: style.gradientAngle,
          gradientStops: style.gradientStops,
          clipMask: style.clipMask
        } :
        l
        )
      });
      toast.success('Style pasted!');
    },
    [state]
  );
  const updateState = (u: Partial<GlowState>) =>
  onStateChange({
    ...state,
    ...u
  });
  const handleAddLayer = () => {
    const nl: GlowLayer = {
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
      blendMode: 'screen'
    };
    updateState({
      layers: [...state.layers, nl],
      selectedLayerId: nl.id
    });
  };
  const handleRemoveLayer = (id: string) => {
    if (state.layers.length <= 1) return;
    const nl = state.layers.filter((l) => l.id !== id);
    updateState({
      layers: nl,
      selectedLayerId: nl[0].id
    });
  };
  const handleDuplicate = (id: string) => {
    const l = state.layers.find((x) => x.id === id);
    if (!l) return;
    const d = duplicateLayer(l);
    updateState({
      layers: [...state.layers, d],
      selectedLayerId: d.id
    });
    toast.success('Layer duplicated');
  };
  const handleRandomize = () => {
    setRandomSpin(true);
    setTimeout(() => setRandomSpin(false), 440);
    onStateChange(generateRandomGlow());
    toast.success('Randomized!');
  };
  const handleExport = () => {
    if (exportState !== 'idle') return;
    setExportState('loading');
    onOpenExport();
    setTimeout(() => {
      setExportState('success');
      setTimeout(() => setExportState('idle'), 1800);
    }, 1400);
  };
  const handleCopy = () => {
    navigator.clipboard?.
    writeText('/* Copied from GLOW Editor */').
    catch(() => {});
    setCopyState('copied');
    toast.success('CSS copied!');
    setTimeout(() => setCopyState('idle'), 1800);
  };
  const handleLoadBuiltIn = (s: GlowState) => onStateChange(s);
  const masterOn = state.power;
  return (
    <div
      className="w-[280px] flex-shrink-0 rounded-3xl flex flex-col max-h-[calc(100vh-1.5rem)] overflow-hidden m-1.5 shadow-2xl border"
      style={{
        background:
        'linear-gradient(130deg, rgba(255,255,255,0.042) 0%, transparent 42%), linear-gradient(220deg, rgba(168,255,80,0.022) 0%, transparent 50%), rgba(255,255,255,0.018)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderColor: 'rgba(255,255,255,0.05)',
        boxShadow:
        '0 28px 48px -14px rgba(0,0,0,0.85), 0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.22)'
      }}>
      
      {/* Header */}
      <div
        className="flex flex-col gap-3 border-b"
        style={{
          padding: '16px 16px 14px',
          background: 'rgba(255,255,255,0.016)',
          borderColor: 'rgba(255,255,255,0.05)'
        }}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="relative w-8 h-8 flex items-center justify-center rounded-[14px] overflow-hidden"
              style={{
                background: GLOW.primaryDim
              }}>
              
              <div
                className="absolute inset-0 transition-colors duration-200"
                style={{
                  background: GLOW.primaryDim,
                  filter: 'blur(10px)'
                }} />
              
              <span
                className="relative z-10 w-[13px] h-[13px] rounded-full"
                style={{
                  background: GLOW.primary,
                  boxShadow: `0 0 12px rgba(168,255,80,0.65), 0 0 4px rgba(168,255,80,0.90)`
                }} />
              
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[13px] font-bold tracking-[0.07em] leading-none"
                style={{
                  color: 'rgba(255,255,255,0.97)'
                }}>
                
                GLOW
              </span>
              <span
                className="font-mono text-[8px] font-medium tracking-[0.11em] uppercase leading-none"
                style={{
                  color: 'rgba(168,255,80,0.72)'
                }}>
                
                Editor Studio
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-0.5"
            role="toolbar"
            aria-label="History">
            
            <motion.button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              whileTap={{
                scale: 0.87
              }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border-none outline-none transition-all group"
              style={{
                background: 'transparent',
                color: !canUndo ?
                'rgba(255,255,255,0.20)' :
                'rgba(255,255,255,0.38)',
                cursor: !canUndo ? 'not-allowed' : 'pointer',
                opacity: !canUndo ? 0.22 : 1
              }}>
              
              <Undo2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
            </motion.button>
            <motion.button
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              whileTap={{
                scale: 0.87
              }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border-none outline-none transition-all group"
              style={{
                background: 'transparent',
                color: !canRedo ?
                'rgba(255,255,255,0.20)' :
                'rgba(255,255,255,0.38)',
                cursor: !canRedo ? 'not-allowed' : 'pointer',
                opacity: !canRedo ? 0.22 : 1
              }}>
              
              <Redo2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleRandomize}
            aria-label="Randomize"
            whileTap={{
              scale: 0.96
            }}
            className="flex flex-1 items-center justify-center gap-[7px] h-9 px-3 rounded-2xl border outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.034)',
              borderColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.60)',
              fontSize: '11px',
              fontWeight: 700
            }}>
            
            <motion.span
              animate={{
                rotate: randomSpin ? 180 : 0
              }}
              transition={{
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="flex-shrink-0">
              
              <Shuffle
                className="w-[14px] h-[14px]"
                style={{
                  color: GLOW.primary
                }}
                strokeWidth={2} />
              
            </motion.span>
            Random
          </motion.button>
          <motion.button
            onClick={handleExport}
            disabled={exportState === 'loading'}
            aria-label="Export"
            whileTap={{
              scale: 0.94
            }}
            className="relative overflow-hidden flex items-center gap-[7px] h-9 px-4 rounded-2xl border-none outline-none transition-all"
            style={{
              background:
              exportState === 'success' ?
              '#00C26A' :
              exportState === 'loading' ?
              'rgba(168,255,80,0.58)' :
              GLOW.primary,
              color: exportState === 'success' ? '#fff' : '#0A0A0A',
              fontSize: '11px',
              fontWeight: 700
            }}>
            
            <Code
              className="w-[14px] h-[14px] flex-shrink-0"
              strokeWidth={2.2} />
            
            <span>
              {exportState === 'loading' ?
              'Exporting…' :
              exportState === 'success' ?
              'Done' :
              'Export'}
            </span>
          </motion.button>
        </div>
        <div className="flex items-center gap-2">
          {onShare &&
          <motion.button
            onClick={onShare}
            aria-label="Share"
            whileTap={{
              scale: 0.96
            }}
            className="flex flex-1 items-center justify-center gap-[7px] h-8 px-3 rounded-2xl border outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.034)',
              borderColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.60)',
              fontSize: '10px',
              fontWeight: 700
            }}>
            
              <Share2
              className="w-[13px] h-[13px]"
              style={{
                color: GLOW.primary
              }}
              strokeWidth={2} />
            
              Share
            </motion.button>
          }
          {onOpenCommandPalette &&
          <motion.button
            onClick={onOpenCommandPalette}
            aria-label="Command Palette"
            whileTap={{
              scale: 0.96
            }}
            className="flex flex-1 items-center justify-center gap-[7px] h-8 px-3 rounded-2xl border outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.034)',
              borderColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.50)',
              fontSize: '10px',
              fontWeight: 700
            }}>
            
              <Command className="w-[13px] h-[13px]" strokeWidth={2} />
              ⌘K
            </motion.button>
          }
        </div>
      </div>

      {/* Power toggle */}
      <div
        className="border-b"
        style={{
          padding: '14px 16px',
          borderColor: 'rgba(255,255,255,0.05)'
        }}>
        
        <div
          className="flex items-center justify-between gap-3 rounded-xl border transition-all duration-300"
          style={{
            padding: '11px 13px',
            background: masterOn ?
            'rgba(168,255,80,0.07)' :
            'rgba(255,255,255,0.034)',
            borderColor: masterOn ?
            'rgba(168,255,80,0.18)' :
            'rgba(255,255,255,0.05)'
          }}>
          
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.09em] leading-none"
              style={{
                color: 'rgba(255,255,255,0.97)'
              }}>
              
              Power
            </span>
            <span
              className="font-mono text-[9px] tracking-[0.03em] transition-colors duration-200"
              style={{
                color: masterOn ?
                'rgba(168,255,80,0.62)' :
                'rgba(255,255,255,0.38)'
              }}>
              
              {masterOn ? 'Master Toggle' : 'Effects paused'}
            </span>
          </div>
          <div
            className="relative flex-shrink-0"
            style={{
              width: 44,
              height: 24
            }}>
            
            <input
              type="checkbox"
              id="masterToggleGlow"
              checked={masterOn}
              onChange={(e) =>
              updateState({
                power: e.target.checked
              })
              }
              className="absolute opacity-0 w-0 h-0" />
            
            <label
              htmlFor="masterToggleGlow"
              className="block cursor-pointer rounded-full transition-all duration-300"
              style={{
                width: 44,
                height: 24,
                background: masterOn ? GLOW.primary : 'rgba(255,255,255,0.10)',
                border: masterOn ?
                `2px solid rgba(168,255,80,0.35)` :
                '2px solid transparent',
                position: 'relative'
              }}>
              
              <span
                className="absolute top-[2px] rounded-full transition-all"
                style={{
                  width: 16,
                  height: 16,
                  background: masterOn ? '#0A0A0A' : 'rgba(255,255,255,0.48)',
                  transform: masterOn ? 'translateX(22px)' : 'translateX(2px)',
                  transitionDuration: '280ms'
                }} />
              
            </label>
          </div>
        </div>
      </div>

      {/* Component picker */}
      <div
        className="border-b"
        style={{
          padding: '14px 16px',
          borderColor: 'rgba(255,255,255,0.05)'
        }}>
        
        <div
          className="font-mono text-[8px] font-medium uppercase tracking-[0.10em] mb-2.5 select-none"
          style={{
            color: 'rgba(255,255,255,0.20)'
          }}>
          
          Component
        </div>
        <div
          className="grid grid-cols-4 gap-1.5"
          role="radiogroup"
          aria-label="Component type">
          
          {[
          {
            value: 'button',
            label: 'Button',
            icon:
            <>
                  <rect x="3" y="8" width="18" height="8" rx="4" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </>

          },
          {
            value: 'card',
            label: 'Card',
            icon:
            <>
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </>

          },
          {
            value: 'header',
            label: 'Header',
            icon:
            <>
                  <rect x="2" y="3" width="20" height="5" rx="2" />
                  <line x1="5" y1="5.5" x2="10" y2="5.5" />
                </>

          },
          {
            value: 'hero',
            label: 'Hero',
            icon:
            <>
                  <rect x="2" y="3" width="20" height="13" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                </>

          },
          {
            value: 'input',
            label: 'Input',
            icon:
            <>
                  <rect x="3" y="8" width="18" height="8" rx="2" />
                  <line x1="7" y1="12" x2="7.01" y2="12" strokeWidth={2.2} />
                </>

          },
          {
            value: 'modal',
            label: 'Modal',
            icon:
            <>
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <line x1="4" y1="9" x2="20" y2="9" />
                </>

          },
          {
            value: 'nav',
            label: 'Nav',
            icon:
            <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="14" y2="17" />
                </>

          },
          {
            value: 'badge',
            label: 'Badge',
            icon:
            <>
                  <rect x="5" y="9" width="14" height="6" rx="3" />
                  <line x1="9" y1="12" x2="15" y2="12" strokeWidth={1.3} />
                </>

          }].
          map(({ value, label, icon }) => {
            const isSelected = (state as any).componentType === value;
            return (
              <label
                key={value}
                style={{
                  position: 'relative'
                }}>
                
                <input
                  type="radio"
                  name="glowComponent"
                  value={value}
                  checked={isSelected}
                  onChange={() =>
                  updateState({
                    componentType: value
                  } as any)
                  }
                  className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                
                <motion.span
                  whileHover={{
                    y: -1
                  }}
                  whileTap={{
                    scale: 0.95
                  }}
                  className="flex flex-col items-center justify-center gap-[7px] cursor-pointer rounded-2xl border transition-all select-none overflow-hidden"
                  style={{
                    padding: '11px 6px 10px',
                    background: isSelected ?
                    'rgba(168,255,80,0.07)' :
                    'rgba(255,255,255,0.034)',
                    borderColor: isSelected ?
                    'rgba(168,255,80,0.28)' :
                    'rgba(255,255,255,0.05)',
                    position: 'relative'
                  }}>
                  
                  {isSelected &&
                  <span
                    className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full"
                    style={{
                      background: GLOW.primary,
                      boxShadow: `0 0 6px ${GLOW.primaryGlow}`
                    }} />

                  }
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-100"
                    fill="none"
                    stroke={
                    isSelected ? GLOW.primary : 'rgba(255,255,255,0.38)'
                    }
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    
                    {icon}
                  </svg>
                  <span
                    className="font-mono text-[8.5px] font-medium leading-none text-center whitespace-nowrap transition-colors duration-100"
                    style={{
                      color: isSelected ?
                      'rgba(255,255,255,0.97)' :
                      'rgba(255,255,255,0.38)'
                    }}>
                    
                    {label}
                  </span>
                </motion.span>
              </label>);

          })}
        </div>
      </div>

      {/* Mode select + Copy */}
      <div
        className="border-b"
        style={{
          padding: '14px 16px',
          borderColor: 'rgba(255,255,255,0.05)'
        }}>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={state.themeMode}
              onChange={(e) =>
              updateState({
                themeMode: e.target.value as 'dark' | 'light'
              })
              }
              className="w-full h-9 rounded-2xl border outline-none transition-all appearance-none font-bold"
              style={{
                paddingLeft: 12,
                paddingRight: 30,
                background: 'rgba(255,255,255,0.034)',
                borderColor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.60)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}>
              
              <option
                value="dark"
                style={{
                  background: '#111',
                  color: 'rgba(255,255,255,0.90)'
                }}>
                
                Dark Aesthetics
              </option>
              <option
                value="light"
                style={{
                  background: '#111',
                  color: 'rgba(255,255,255,0.90)'
                }}>
                
                Light Mode
              </option>
            </select>
            <span
              className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                color: 'rgba(255,255,255,0.20)'
              }}>
              
              <svg
                viewBox="0 0 24 24"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round">
                
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
        <div
          className="rounded-2xl p-4 border space-y-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)'
          }}>
          
          <LayerManager
            layers={state.layers}
            selectedId={state.selectedLayerId}
            onSelect={(id) =>
            updateState({
              selectedLayerId: id
            })
            }
            onUpdate={(layers) =>
            updateState({
              layers
            })
            }
            onAdd={handleAddLayer}
            onRemove={handleRemoveLayer}
            onDuplicate={handleDuplicate}
            groups={state.groups || []}
            onGroupsChange={(groups) =>
            updateState({
              groups
            })
            }
            selectedGroupId={state.selectedGroupId || null}
            onSelectGroup={(id) =>
            updateState({
              selectedGroupId: id
            })
            }
            copiedStyle={state.copiedStyle || null}
            onCopyStyle={handleCopyStyle}
            onPasteStyle={handlePasteStyle} />
          
        </div>
        <div
          className="rounded-2xl p-4 border space-y-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)'
          }}>
          
          <TemplateBrowser onLoad={handleLoadBuiltIn} />
        </div>
        <div
          className="rounded-2xl p-4 border space-y-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)'
          }}>
          
          <div className="space-y-3">
            {showPresetInput ?
            <motion.div
              initial={{
                opacity: 0,
                y: 4
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              className="flex flex-col gap-2">
              
                <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && presetName.trim()) {
                    onSavePreset(presetName.trim());
                    setPresetName('');
                    setShowPresetInput(false);
                    toast.success('Preset saved!');
                  }
                }}
                placeholder="Enter preset name..."
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white outline-none font-bold transition-all focus:border-primary/40"
                autoFocus />
              
                <div className="flex gap-2">
                  <button
                  onClick={() => {
                    if (presetName.trim()) {
                      onSavePreset(presetName.trim());
                      setPresetName('');
                      setShowPresetInput(false);
                      toast.success('Preset saved!');
                    }
                  }}
                  className="flex-1 py-2 rounded-xl text-[11px] font-bold text-black transition-all"
                  style={{
                    background: GLOW.primary
                  }}>
                  
                    Save Preset
                  </button>
                  <button
                  onClick={() => setShowPresetInput(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all text-[11px] font-bold">
                  
                    ✕
                  </button>
                </div>
              </motion.div> :

            <motion.button
              whileHover={{
                scale: 1.01
              }}
              whileTap={{
                scale: 0.99
              }}
              onClick={() => setShowPresetInput(true)}
              className="w-full h-10 px-4 border border-white/5 hover:border-white/10 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.70)'
              }}>
              
                <Save
                className="w-3.5 h-3.5 transition-colors"
                style={{
                  color: 'rgba(168,255,80,0.60)'
                }} />
              
                Create Preset
              </motion.button>
            }
            <PresetManagerUI
              presets={presetManager.presets}
              onLoad={(id: string) => {
                const l = presetManager.loadPreset(id);
                if (l) {
                  onStateChange(l);
                  toast.success('Preset loaded!');
                }
              }}
              onDelete={presetManager.deletePreset}
              onToggleFavorite={presetManager.toggleFavorite}
              onExport={presetManager.exportPresets}
              onImport={presetManager.importPresets} />
            
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t"
        style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.016)',
          borderColor: 'rgba(255,255,255,0.05)',
          opacity: 0.5
        }}>
        
        <span
          className="text-[9px] font-bold tracking-wider"
          style={{
            color: 'rgba(255,255,255,0.60)'
          }}>
          
          BUILDER FUSION
        </span>
        <span
          className="font-mono text-[9px]"
          style={{
            color: 'rgba(255,255,255,0.40)'
          }}>
          
          v2.0.26
        </span>
      </div>
    </div>);

}