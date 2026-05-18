import React, { useCallback, useState, useRef, createElement } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import {
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Activity,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer2,
  Crosshair,
  Eye,
  EyeOff,
  CopyPlus,
  Trash2,
  Sparkles,
  Image } from
'lucide-react';
import { cn } from '../../lib/utils';
import type {
  GlowState,
  CanvasBackground,
  GlowLayer } from
'../../lib/glow-types';
import { getLayerBackground } from '../../lib/glow-types';
import { exportAsSVG } from '../../lib/glow-export';
import { toast } from 'sonner';
interface PreviewProps {
  state: GlowState;
  setPower: (v: boolean) => void;
  onStateChange: (v: GlowState) => void;
  onLayerSelect: (id: string) => void;
  cssOverride: string | null;
}
const frameDimensions = {
  mobile: {
    w: 320,
    h: 400,
    label: 'Mobile',
    icon: Smartphone
  },
  tablet: {
    w: 500,
    h: 620,
    label: 'Tablet',
    icon: Tablet
  },
  desktop: {
    w: 820,
    h: 520,
    label: 'Desktop',
    icon: Monitor
  }
};
const CANVAS_BACKGROUNDS: {
  id: CanvasBackground;
  label: string;
  style: React.CSSProperties;
}[] = [
{
  id: 'dark',
  label: 'Dark',
  style: {
    background: '#0a0a0a'
  }
},
{
  id: 'light',
  label: 'Light',
  style: {
    background: '#f5f5f5'
  }
},
{
  id: 'gradient-sunset',
  label: 'Sunset',
  style: {
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
  }
},
{
  id: 'gradient-ocean',
  label: 'Ocean',
  style: {
    background: 'linear-gradient(135deg, #0c1445, #1a237e, #0d47a1)'
  }
},
{
  id: 'gradient-aurora',
  label: 'Aurora',
  style: {
    background: 'linear-gradient(135deg, #0d0d0d, #1a0a2e, #0a2a1a, #0d0d0d)'
  }
},
{
  id: 'mesh-dark',
  label: 'Mesh',
  style: {
    background:
    'radial-gradient(at 40% 20%, #1a1a2e 0px, transparent 50%), radial-gradient(at 80% 0%, #16213e 0px, transparent 50%), radial-gradient(at 0% 50%, #0f3460 0px, transparent 50%), #0a0a0a'
  }
},
{
  id: 'dots',
  label: 'Dots',
  style: {
    background: '#0a0a0a',
    backgroundImage:
    'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  }
},
{
  id: 'transparent',
  label: 'Check',
  style: {
    background:
    'repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px',
    backgroundColor: '#0a0a0a'
  }
}];

function getLayerAnimationStyle(layer: GlowLayer): React.CSSProperties {
  const anim = layer.layerAnimation;
  if (!anim || !anim.enabled || anim.type === 'none') return {};
  const keyframeMap: Record<string, string> = {
    pulse: `pulse-${layer.id} ${anim.duration}s ease-in-out ${anim.delay}s infinite`,
    breathe: `breathe-${layer.id} ${anim.duration}s ease-in-out ${anim.delay}s infinite`,
    orbit: `orbit-${layer.id} ${anim.duration}s linear ${anim.delay}s infinite`,
    drift: `drift-${layer.id} ${anim.duration}s ease-in-out ${anim.delay}s infinite`,
    flicker: `flicker-${layer.id} ${anim.duration}s steps(1) ${anim.delay}s infinite`,
    colorShift: `colorShift-${layer.id} ${anim.duration}s ease-in-out ${anim.delay}s infinite`
  };
  return {
    animation: keyframeMap[anim.type] || undefined
  };
}
function generateLayerKeyframes(layers: GlowLayer[]): string {
  return layers.
  filter(
    (l) => l.layerAnimation?.enabled && l.layerAnimation.type !== 'none'
  ).
  map((layer) => {
    const a = layer.layerAnimation!;
    const id = layer.id;
    switch (a.type) {
      case 'pulse':
        return `@keyframes pulse-${id} { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: ${layer.opacity}; } 50% { transform: translate(-50%, -50%) scale(1.15); opacity: ${layer.opacity * 0.7}; } }`;
      case 'breathe':
        return `@keyframes breathe-${id} { 0%, 100% { transform: translate(-50%, -50%) scale(1); filter: blur(${layer.blur}px); } 50% { transform: translate(-50%, -50%) scale(1.08); filter: blur(${layer.blur * 1.3}px); } }`;
      case 'orbit':
        return `@keyframes orbit-${id} { 0% { transform: translate(-50%, -50%) rotate(0deg) translateX(30px) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg) translateX(30px) rotate(-360deg); } }`;
      case 'drift':
        return `@keyframes drift-${id} { 0%, 100% { transform: translate(-50%, -50%) translate(0px, 0px); } 25% { transform: translate(-50%, -50%) translate(20px, -15px); } 50% { transform: translate(-50%, -50%) translate(-10px, 20px); } 75% { transform: translate(-50%, -50%) translate(15px, 10px); } }`;
      case 'flicker':
        return `@keyframes flicker-${id} { 0%, 100% { opacity: ${layer.opacity}; } 10% { opacity: ${layer.opacity * 0.4}; } 20% { opacity: ${layer.opacity}; } 40% { opacity: ${layer.opacity * 0.6}; } 60% { opacity: ${layer.opacity * 0.9}; } 80% { opacity: ${layer.opacity * 0.3}; } }`;
      case 'colorShift':
        return `@keyframes colorShift-${id} { 0%, 100% { filter: blur(${layer.blur}px) hue-rotate(0deg); } 50% { filter: blur(${layer.blur}px) hue-rotate(60deg); } }`;
      default:
        return '';
    }
  }).
  filter(Boolean).
  join('\n');
}
export function GlowPreview({
  state,
  onStateChange,
  onLayerSelect
}: PreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [frameSize, setFrameSize] = useState<'mobile' | 'tablet' | 'desktop'>(
    'mobile'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const isDark = state.themeMode === 'dark';
  const currentFrame = frameDimensions[frameSize];
  const activeLayerCount = state.layers.filter((l) => l.active).length;
  const selectedLayer = state.layers.find((l) => l.id === state.selectedLayerId);
  const canvasBg = state.canvasBackground || 'dark';
  const bgPreset =
  CANVAS_BACKGROUNDS.find((b) => b.id === canvasBg) || CANVAS_BACKGROUNDS[0];
  const layerKeyframesCss = generateLayerKeyframes(state.layers);
  const handleExportImage = async () => {
    if (!previewRef.current) return;
    try {
      setIsExporting(true);
      const svgStr = exportAsSVG(state, currentFrame.w, currentFrame.h);
      const blob = new Blob([svgStr], {
        type: 'image/svg+xml'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `glow-preview-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('SVG exported!');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };
  const handleLayerDrag = useCallback(
    (id: string, info: PanInfo) => {
      const updatedLayers = state.layers.map((l) =>
      l.id === id ?
      {
        ...l,
        x: l.x + info.delta.x / zoom,
        y: l.y + info.delta.y / zoom
      } :
      l
      );
      onStateChange({
        ...state,
        layers: updatedLayers
      });
    },
    [state, zoom, onStateChange]
  );
  const handleZoom = (dir: 'in' | 'out' | 'reset') => {
    if (dir === 'reset') setZoom(1);else

    setZoom((z) =>
    Math.max(
      0.25,
      Math.min(3, +(z + (dir === 'in' ? 0.25 : -0.25)).toFixed(2))
    )
    );
  };
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.25, Math.min(3, +(z + delta).toFixed(2))));
    }
  }, []);
  const animatedLayers = state.layers.filter(
    (l) => l.layerAnimation?.enabled && l.layerAnimation.type !== 'none'
  );
  return (
    <div
      className="flex flex-col h-full w-full relative group/canvas"
      onWheel={handleWheel}>
      
      {layerKeyframesCss &&
      <style
        dangerouslySetInnerHTML={{
          __html: layerKeyframesCss
        }} />

      }

      {/* Floating top toolbar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 transition-all duration-500 opacity-60 hover:opacity-100 group-hover/canvas:translate-y-[-4px]">
        <div className="flex items-center gap-1.5 p-2 px-3 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl relative overflow-hidden group/toolbar">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/toolbar:opacity-100 transition-opacity pointer-events-none" />
          {(['mobile', 'tablet', 'desktop'] as const).map((size) => {
            const Icon = frameDimensions[size].icon;
            return (
              <ToolBtn
                key={size}
                active={frameSize === size}
                onClick={() => setFrameSize(size)}
                title={frameDimensions[size].label}>
                
                <Icon className="w-4 h-4" />
              </ToolBtn>);

          })}
        </div>
        <div className="flex items-center gap-1.5 p-2 px-4 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl group/zoom">
          <ToolBtn onClick={() => handleZoom('out')} title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </ToolBtn>
          <button
            onClick={() => handleZoom('reset')}
            className="px-3 py-1.5 text-[11px] text-white/50 hover:text-white font-black min-w-[54px] text-center transition-all rounded-xl hover:bg-white/10 tracking-widest">
            
            {Math.round(zoom * 100)}%
          </button>
          <ToolBtn onClick={() => handleZoom('in')} title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </ToolBtn>
        </div>
        <div className="flex items-center gap-1.5 p-2 px-3 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl">
          <ToolBtn
            active={showDimensions}
            onClick={() => setShowDimensions(!showDimensions)}
            title="Dimensions">
            
            <Maximize2 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn
            active={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            title="Grid overlay">
            
            <div className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn
            active={showBgPicker}
            onClick={() => setShowBgPicker(!showBgPicker)}
            title="Background">
            
            <Image className="w-4 h-4" />
          </ToolBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolBtn
            onClick={handleExportImage}
            title="Export PNG"
            className="bg-primary/20 text-primary hover:bg-primary hover:text-black">
            
            {isExporting ?
            <Activity className="w-4 h-4 animate-pulse" /> :

            <Download className="w-4 h-4" />
            }
          </ToolBtn>
        </div>
      </div>

      {/* Background Preset Picker */}
      <AnimatePresence>
        {showBgPicker &&
        <motion.div
          initial={{
            opacity: 0,
            y: -10,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: -10,
            scale: 0.95
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-3 bg-black/80 border border-white/10 backdrop-blur-3xl rounded-2xl shadow-2xl">
          
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mr-1">
              BG
            </span>
            {CANVAS_BACKGROUNDS.map((bg) =>
          <motion.button
            key={bg.id}
            whileHover={{
              scale: 1.15,
              y: -2
            }}
            whileTap={{
              scale: 0.9
            }}
            onClick={() =>
            onStateChange({
              ...state,
              canvasBackground: bg.id
            })
            }
            title={bg.label}
            className={cn(
              'w-8 h-8 rounded-lg border-2 transition-all overflow-hidden',
              canvasBg === bg.id ?
              'border-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]' :
              'border-white/10 hover:border-white/30'
            )}
            style={bg.style} />

          )}
          </motion.div>
        }
      </AnimatePresence>

      {/* Canvas area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden group/studio"
        style={{
          background: '#050505'
        }}>
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
        {showRulers &&
        <CanvasRulers
          width={currentFrame.w}
          height={currentFrame.h}
          zoom={zoom} />

        }
        <div
          className="relative z-10"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.4s cubic-bezier(0.2, 0, 0, 1)'
          }}>
          
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: state.power ? [0.2, 0.35, 0.2] : 0
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute -inset-20 rounded-[4rem] blur-[100px] pointer-events-none z-0"
            style={{
              background:
              state.power && activeLayerCount > 0 ?
              `radial-gradient(circle, ${state.layers.find((l) => l.active)?.color ?? 'transparent'}50, transparent 75%)` :
              'transparent'
            }} />
          

          <div
            ref={previewRef}
            className={cn(
              'relative overflow-hidden rounded-[2rem] border transition-all duration-500 z-10',
              'shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_40px_120px_-20px_rgba(0,0,0,0.8),0_12px_40px_-10px_rgba(0,0,0,0.4)]'
            )}
            style={{
              width: currentFrame.w,
              height: currentFrame.h,
              ...bgPreset.style,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }}>
            
            <AnimatePresence>
              {showGrid &&
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
                className="absolute inset-0 z-50 pointer-events-none"
                style={{
                  backgroundImage:
                  'linear-gradient(hsla(0 0% 100% / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsla(0 0% 100% / 0.07) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />

              }
            </AnimatePresence>
            {showDimensions &&
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                <div className="w-px h-full bg-primary/10 absolute" />
                <div className="h-px w-full bg-primary/10 absolute" />
                <Crosshair className="w-4 h-4 text-primary/20" />
              </div>
            }
            <div
              className="absolute inset-0 glow-container"
              style={{
                transform: `scale(${state.globalScale})`,
                opacity: state.power ? state.globalOpacity : 0,
                transition: 'opacity 0.5s ease'
              }}>
              
              <AnimatePresence>
                {state.layers.map((layer, index) => {
                  const group = layer.groupId ?
                  (state.groups || []).find((g) => g.id === layer.groupId) :
                  null;
                  const isGroupHidden = group && !group.active;
                  return layer.active && !isGroupHidden ?
                  <motion.div
                    key={layer.id}
                    drag
                    dragMomentum={false}
                    onTap={() => onLayerSelect(layer.id)}
                    onDrag={(_, info) => handleLayerDrag(layer.id, info)}
                    onHoverStart={() => setHoveredLayer(layer.id)}
                    onHoverEnd={() => setHoveredLayer(null)}
                    className={cn(
                      'absolute top-1/2 left-1/2 rounded-full cursor-move transition-shadow duration-200',
                      state.selectedLayerId === layer.id ?
                      'ring-2 ring-primary/50 z-50 shadow-[0_0_20px_rgba(var(--primary),0.3)]' :
                      hoveredLayer === layer.id ?
                      'ring-1 ring-foreground/15' :
                      ''
                    )}
                    style={{
                      x: layer.x,
                      y: layer.y,
                      translateX: '-50%',
                      translateY: '-50%',
                      width: layer.width,
                      height: layer.height,
                      background: getLayerBackground(layer),
                      filter: `blur(${layer.blur}px)`,
                      opacity: (() => {
                        const g = layer.groupId ?
                        (state.groups || []).find(
                          (gr) => gr.id === layer.groupId
                        ) :
                        null;
                        return g ? layer.opacity * g.opacity : layer.opacity;
                      })(),
                      mixBlendMode: (() => {
                        const g = layer.groupId ?
                        (state.groups || []).find(
                          (gr) => gr.id === layer.groupId
                        ) :
                        null;
                        return (g ? g.blendMode : layer.blendMode) as any;
                      })(),
                      zIndex: index,
                      ...getLayerAnimationStyle(layer),
                      ...(layer.clipMask?.imageUrl ?
                      {
                        WebkitMaskImage: `url(${layer.clipMask.imageUrl})`,
                        maskImage: `url(${layer.clipMask.imageUrl})`,
                        WebkitMaskSize: layer.clipMask.fit,
                        maskSize: layer.clipMask.fit,
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        borderRadius: 0
                      } :
                      {})
                    }}>
                    
                      {state.selectedLayerId === layer.id &&
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.9,
                        y: 10
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0
                      }}
                      className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/80 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl z-[1000] pointer-events-auto">
                      
                          <ToolBtn
                        onClick={() => {
                          onStateChange({
                            ...state,
                            layers: state.layers.map((l) =>
                            l.id === layer.id ?
                            {
                              ...l,
                              active: !l.active
                            } :
                            l
                            )
                          });
                        }}
                        className="p-1.5 rounded-lg">
                        
                            {layer.active ?
                        <Eye className="w-3.5 h-3.5" /> :

                        <EyeOff className="w-3.5 h-3.5" />
                        }
                          </ToolBtn>
                          <div className="w-px h-4 bg-white/10" />
                          <ToolBtn
                        onClick={() => {
                          const nl = {
                            ...layer,
                            id: `layer-${Date.now()}`,
                            name: `${layer.name} Copy`,
                            x: layer.x + 20,
                            y: layer.y + 20
                          };
                          onStateChange({
                            ...state,
                            layers: [...state.layers, nl],
                            selectedLayerId: nl.id
                          });
                          toast.success('Layer duplicated');
                        }}
                        className="p-1.5 rounded-lg">
                        
                            <CopyPlus className="w-3.5 h-3.5" />
                          </ToolBtn>
                          <ToolBtn
                        onClick={() => {
                          if (state.layers.length > 1) {
                            const nl = state.layers.filter(
                              (l) => l.id !== layer.id
                            );
                            onStateChange({
                              ...state,
                              layers: nl,
                              selectedLayerId: nl[0].id
                            });
                            toast.success('Layer removed');
                          }
                        }}
                        className="p-1.5 rounded-lg hover:text-destructive">
                        
                            <Trash2 className="w-3.5 h-3.5" />
                          </ToolBtn>
                          <div className="w-px h-4 bg-white/10" />
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                            <Sparkles className="w-3 h-3 text-primary/60" />
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                              Selected
                            </span>
                          </div>
                        </motion.div>
                    }
                      {showDimensions && state.selectedLayerId === layer.id &&
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.9
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1
                      }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-[999]">
                      
                          <span className="canvas-toolbar px-2 py-1 text-[9px] font-mono whitespace-nowrap">
                            {layer.width}×{layer.height} · (
                            {Math.round(layer.x)}, {Math.round(layer.y)})
                          </span>
                        </motion.div>
                    }
                      {hoveredLayer === layer.id &&
                    state.selectedLayerId !== layer.id &&
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 4
                      }}
                      animate={{
                        opacity: 1,
                        y: 0
                      }}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-[999]">
                      
                            <span className="text-[9px] text-muted-foreground/80 font-mono whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                              {layer.name}
                            </span>
                          </motion.div>
                    }
                    </motion.div> :
                  null;
                })}
              </AnimatePresence>
            </div>
            {state.noiseEnabled &&
            <div
              className="absolute inset-0 pointer-events-none z-[100]"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.15'/></svg>")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px',
                opacity: state.noiseIntensity,
                mixBlendMode: 'overlay'
              }} />

            }
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 opacity-60 hover:opacity-100 group-hover/canvas:translate-y-[4px]">
        <div className="px-6 py-3 flex items-center gap-6 text-[10px] font-black tracking-[0.2em] text-white/40 bg-black/60 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] shadow-2xl uppercase">
          <span className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
              className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
            
            {currentFrame.w}×{currentFrame.h}
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span>{activeLayerCount} LAYERS</span>
          {animatedLayers.length > 0 &&
          <>
              <span className="w-px h-4 bg-white/10" />
              <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors">
              
                <motion.div
                animate={{
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
                className="w-2 h-2 rounded-full bg-primary/60" />
              
                {animatedLayers.length} ANIMATED
              </button>
            </>
          }
          {selectedLayer &&
          <>
              <span className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-2 text-primary font-black">
                <MousePointer2 className="w-3.5 h-3.5" />
                {selectedLayer.name}
              </span>
            </>
          }
        </div>
      </div>
    </div>);

}
function ToolBtn({
  active,
  onClick,
  children,
  title,
  className






}: {active?: boolean;onClick: () => void;children: React.ReactNode;title?: string;className?: string;}) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{
        scale: 1.1,
        y: -2
      }}
      whileTap={{
        scale: 0.9
      }}
      className={cn(
        'p-2.5 rounded-xl transition-all duration-200',
        active ?
        'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10' :
        'text-white/40 hover:text-white hover:bg-white/5',
        className
      )}>
      
      {children}
    </motion.button>);

}
function CanvasRulers({
  width,
  height,
  zoom




}: {width: number;height: number;zoom: number;}) {
  const step = 40;
  const hTicks = Math.ceil(width / step) + 1;
  const vTicks = Math.ceil(height / step) + 1;
  return (
    <>
      <div
        className="absolute top-0 left-1/2 z-20 pointer-events-none"
        style={{
          transform: `translateX(-50%) scale(${zoom})`,
          transformOrigin: 'center top',
          width,
          height: 16
        }}>
        
        <div className="w-full h-full bg-background/40 backdrop-blur-sm border-b border-border/20 flex items-end">
          {Array.from(
            {
              length: hTicks
            },
            (_, i) =>
            <div
              key={i}
              className="absolute bottom-0 flex flex-col items-center"
              style={{
                left: i * step
              }}>
              
                <span className="text-[7px] text-muted-foreground font-mono mb-0.5">
                  {i * step}
                </span>
                <div className="w-px h-1.5 bg-muted-foreground/30" />
              </div>

          )}
        </div>
      </div>
      <div
        className="absolute left-1/2 top-1/2 z-20 pointer-events-none"
        style={{
          transform: `translate(calc(-50% - ${width * zoom / 2}px - 20px), -50%) scale(${zoom})`,
          transformOrigin: 'right center',
          width: 16,
          height
        }}>
        
        <div className="w-full h-full bg-background/40 backdrop-blur-sm border-r border-border/20 flex flex-col">
          {Array.from(
            {
              length: vTicks
            },
            (_, i) =>
            <div
              key={i}
              className="absolute right-0 flex items-center"
              style={{
                top: i * step
              }}>
              
                <span className="text-[7px] text-muted-foreground font-mono mr-0.5 rotate-[-90deg] origin-right">
                  {i * step}
                </span>
                <div className="h-px w-1.5 bg-muted-foreground/30" />
              </div>

          )}
        </div>
      </div>
    </>);

}