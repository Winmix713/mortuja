"use client";

/**
 * ElementProperties — merged best-of-both version.
 *
 * Architecture (from refactored single-file version):
 *  • Single useReducer with SET / RESET_SECTION / RESET_ALL / REPLACE actions
 *  • SECTIONS config array → 18 sections rendered via .map() + memoised SectionShell
 *  • Controlled (value + onChange) and uncontrolled (defaultValue) API
 *
 * Compatibility (from current project split):
 *  • Uses flat ElementStyle shape from ./types (not nested namespaces)
 *  • Imports constants (PANEL, option arrays) from ./constants
 *  • Imports shared UI components from ./components
 *  • Imports FamilyElement, ElementPropertiesProps, SpacingValues from ./types
 */

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  memo,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Box,
  UnfoldHorizontal,
  UnfoldVertical,
  Scan,
  Square,
  Layers,
  MousePointer2,
  MoveHorizontal,
  MoveVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Palette,
  ImageIcon,
  Frame,
  Link2,
  Link as LinkIcon,
  Unlink,
  Code2,
  Hash,
  LayoutGrid,
  Eye,
  EyeOff,
  RotateCw,
  Maximize2,
  CornerUpLeft,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Anchor,
  ChevronRight,
  ArrowUpRight,
  Copy,
  Sparkles,
  Globe2,
  Minus,
} from "lucide-react";

import {
  PropertySection,
  PropertyInput,
  PropertySelect,
  ColorPicker,
  PanelHeader,
  BoxModelWidget,
  TailwindChipInput,
  SectionResetButton,
  PositionTypeSelector,
  AlignmentGrid,
  SegmentedControl,
  GroupHeader,
} from "./components";
import {
  PANEL,
  DEFAULT_FAMILY_ELEMENTS,
  INITIAL_STYLE,
  SPACING_OPTIONS,
  Z_OPTIONS,
  POINTER_OPTIONS,
  DISPLAY_OPTIONS,
  DIRECTION_OPTIONS,
  JUSTIFY_OPTIONS,
  ALIGN_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  OVERFLOW_OPTIONS,
  CURSOR_OPTIONS,
  BG_SIZE_OPTIONS,
  BG_POS_OPTIONS,
  BORDER_STYLE_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  MAX_W_OPTIONS,
  TAG_COLORS,
  TAG_TEXT_COLORS,
} from "./constants";
import type {
  ElementStyle,
  ElementPropertiesProps,
  FamilyElement,
  SpacingValues,
  PosType,
  VisibilityValue,
  BgTab,
  LinkType,
  SectionKeys,
} from "./types";
import { Slider } from "@/components/ui/slider";

// ─── Tailwind spacing token → px (gap preview) ────────────────────────────────

const SPACING_PX: Record<string, number> = {
  "0": 0,
  px: 1,
  "0.5": 2,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
};
const tokenToPx = (t: string, fallback = 8) =>
  t in SPACING_PX
    ? SPACING_PX[t]
    : Number.isFinite(parseFloat(t))
    ? parseFloat(t) * PANEL.tailwindUnit
    : fallback;

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET"; patch: Partial<ElementStyle> }
  | { type: "RESET_SECTION"; section: SectionKeys }
  | { type: "RESET_ALL" }
  | { type: "REPLACE"; state: ElementStyle };

function buildSectionReset(section: SectionKeys): Partial<ElementStyle> {
  switch (section) {
    case "link":
      return { link: INITIAL_STYLE.link, linkType: INITIAL_STYLE.linkType, newTab: INITIAL_STYLE.newTab };
    case "textContent":
      return {
        textContent: INITIAL_STYLE.textContent,
        bold: INITIAL_STYLE.bold,
        italic: INITIAL_STYLE.italic,
        underline: INITIAL_STYLE.underline,
        strikethrough: INITIAL_STYLE.strikethrough,
      };
    case "tailwind":
      return { tailwindClasses: INITIAL_STYLE.tailwindClasses };
    case "inlineCss":
      return { inlineCss: INITIAL_STYLE.inlineCss };
    case "elementId":
      return { elementId: INITIAL_STYLE.elementId };
    case "margin":
      return { margin: INITIAL_STYLE.margin };
    case "padding":
      return { padding: INITIAL_STYLE.padding };
    case "position":
      return {
        posType: INITIAL_STYLE.posType,
        position: INITIAL_STYLE.position,
        zIndex: INITIAL_STYLE.zIndex,
        pointerEvents: INITIAL_STYLE.pointerEvents,
      };
    case "size":
      return {
        width: INITIAL_STYLE.width,
        height: INITIAL_STYLE.height,
        aspectLock: INITIAL_STYLE.aspectLock,
      };
    case "maxSize":
      return {
        maxWidth: INITIAL_STYLE.maxWidth,
        maxHeight: INITIAL_STYLE.maxHeight,
        minWidth: INITIAL_STYLE.minWidth,
        minHeight: INITIAL_STYLE.minHeight,
      };
    case "spacing":
      return { gapX: INITIAL_STYLE.gapX, gapY: INITIAL_STYLE.gapY };
    case "alignment":
      return {
        display: INITIAL_STYLE.display,
        flexDirection: INITIAL_STYLE.flexDirection,
        justifyContent: INITIAL_STYLE.justifyContent,
        alignItems: INITIAL_STYLE.alignItems,
        alignPos: INITIAL_STYLE.alignPos,
        flexWrap: INITIAL_STYLE.flexWrap,
        textAlign: INITIAL_STYLE.textAlign,
      };
    case "typography":
      return {
        fontFamily: INITIAL_STYLE.fontFamily,
        fontSize: INITIAL_STYLE.fontSize,
        fontWeight: INITIAL_STYLE.fontWeight,
        lineHeight: INITIAL_STYLE.lineHeight,
        letterSpacing: INITIAL_STYLE.letterSpacing,
        textColor: INITIAL_STYLE.textColor,
      };
    case "appearance":
      return {
        opacity: INITIAL_STYLE.opacity,
        overflow: INITIAL_STYLE.overflow,
        visibility: INITIAL_STYLE.visibility,
        cursor: INITIAL_STYLE.cursor,
      };
    case "background":
      return {
        bgTab: INITIAL_STYLE.bgTab,
        bgColor: INITIAL_STYLE.bgColor,
        bgImage: INITIAL_STYLE.bgImage,
        bgSize: INITIAL_STYLE.bgSize,
        bgPosition: INITIAL_STYLE.bgPosition,
      };
    case "embed":
      return { embedCode: INITIAL_STYLE.embedCode };
    case "border":
      return {
        borderWidth: INITIAL_STYLE.borderWidth,
        borderStyle: INITIAL_STYLE.borderStyle,
        borderColor: INITIAL_STYLE.borderColor,
        borderRadius: INITIAL_STYLE.borderRadius,
        borderRadiusTL: INITIAL_STYLE.borderRadiusTL,
        borderRadiusTR: INITIAL_STYLE.borderRadiusTR,
        borderRadiusBL: INITIAL_STYLE.borderRadiusBL,
        borderRadiusBR: INITIAL_STYLE.borderRadiusBR,
      };
    default:
      return {};
  }
}

function reducer(state: ElementStyle, action: Action): ElementStyle {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.patch };
    case "RESET_SECTION":
      return { ...state, ...buildSectionReset(action.section) };
    case "RESET_ALL":
      return { ...INITIAL_STYLE };
    case "REPLACE":
      return action.state;
    default:
      return state;
  }
}

// ─── Helper UI ────────────────────────────────────────────────────────────────

function SubLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className="block mb-1 uppercase"
      style={{
        fontSize: 8,
        color: "var(--panel-muted)",
        letterSpacing: "0.1em",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

const LinkTypeBtn = memo(function LinkTypeBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`icon-btn flex-col ${active ? "icon-btn-active" : ""}`}
      style={{
        height: "36px",
        minWidth: "36px",
        gap: "3px",
        fontSize: 8,
        padding: "4px 3px",
        borderRadius: "2px",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.06em",
        fontWeight: 600,
      }}
    >
      {icon}
      <span style={{ fontSize: 8, lineHeight: 1, color: "inherit", textTransform: "uppercase" }}>{label}</span>
    </button>
  );
});

function AutoTextarea(props: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const { value, onChange, rows = 2, placeholder, className = "textarea-small w-full resize-none" } = props;
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Section config & render context ─────────────────────────────────────────

interface SectionRenderCtx {
  style: ElementStyle;
  dispatch: React.Dispatch<Action>;
  familyElements: FamilyElement[];
  onElementSelect?: (id: string) => void;
}

interface SectionConfig {
  key: SectionKeys;
  label: string;
  icon: ComponentType<{ size?: number }>;
  defaultOpen: boolean;
  resetSection?: SectionKeys;
  badge?: (s: ElementStyle) => string | undefined;
  extraAction?: (ctx: SectionRenderCtx) => ReactNode;
  render: (ctx: SectionRenderCtx) => ReactNode;
}

// ─── SECTIONS array ───────────────────────────────────────────────────────────

const SECTIONS: SectionConfig[] = [
  // ── 1. Family ──────────────────────────────────────────────────────────────
  {
    key: "family",
    label: "Family Elements",
    icon: Box,
    defaultOpen: true,
    render: ({ familyElements, onElementSelect }) => (
      <div className="flex flex-wrap items-center gap-1">
        {familyElements.map((el, i) => {
          const kind = el.type ?? "div";
          return (
            <div key={el.id} className="flex items-center gap-[3px]">
              {i > 0 && (
                <ChevronRight
                  size={PANEL.iconSizeSm - 1}
                  style={{ color: "var(--panel-muted)" }}
                />
              )}
              <button
                type="button"
                className="family-element-btn"
                onClick={() => onElementSelect?.(el.id)}
              >
                <Box
                  size={PANEL.iconSizeSm - 1}
                  style={{ color: "var(--panel-muted)", flexShrink: 0 }}
                />
                <span>{el.tagName}</span>
                <span
                  style={{
                    fontSize: 7,
                    padding: "1px 4px",
                    borderRadius: 2,
                    background: TAG_COLORS[kind],
                    color: TAG_TEXT_COLORS[kind],
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {kind}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    ),
  },

  // ── 2. Link ────────────────────────────────────────────────────────────────
  {
    key: "link",
    label: "Link",
    icon: Link2,
    defaultOpen: false,
    resetSection: "link",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const placeholders: Record<LinkType, string> = {
        email: "hello@example.com",
        tel: "+1 555 000 0000",
        anchor: "#section-id",
        internal: "/about",
        external: "https://…",
        file: "/files/document.pdf",
      };
      const types: { v: LinkType; icon: ReactNode; label: string }[] = [
        { v: "internal", icon: <Globe2 size={PANEL.iconSizeSm} />, label: "Page" },
        { v: "external", icon: <ExternalLink size={PANEL.iconSizeSm} />, label: "URL" },
        { v: "anchor", icon: <Anchor size={PANEL.iconSizeSm} />, label: "Anchor" },
        { v: "email", icon: <Mail size={PANEL.iconSizeSm} />, label: "Email" },
        { v: "tel", icon: <Phone size={PANEL.iconSizeSm} />, label: "Tel" },
        { v: "file", icon: <FileText size={PANEL.iconSizeSm} />, label: "File" },
      ];
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-[3px]">
            {types.map((t) => (
              <LinkTypeBtn
                key={t.v}
                icon={t.icon}
                label={t.label}
                active={s.linkType === t.v}
                onClick={() => set({ linkType: t.v })}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              className="panel-input flex-1"
              placeholder={placeholders[s.linkType]}
              value={s.link}
              onChange={(e) => set({ link: e.target.value })}
            />
            <button
              type="button"
              className="icon-btn"
              title="Copy link"
              aria-label="Copy link"
              onClick={() => navigator.clipboard?.writeText(s.link)}
            >
              <Copy size={PANEL.iconSizeSm} />
            </button>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.newTab}
              onChange={(e) => set({ newTab: e.target.checked })}
              style={{ accentColor: "var(--panel-accent)" }}
            />
            <span style={{ fontSize: 11, color: "var(--panel-muted)" }}>
              Open in new tab
              <span
                className="ml-1"
                style={{ color: "var(--panel-muted)", fontSize: PANEL.iconSizeSm - 1 }}
              >
                rel=&quot;noopener&quot;
              </span>
            </span>
          </label>
        </div>
      );
    },
  },

  // ── 3. Text Content ────────────────────────────────────────────────────────
  {
    key: "textContent",
    label: "Text Content",
    icon: Type,
    defaultOpen: true,
    resetSection: "textContent",
    extraAction: () => (
      <button
        type="button"
        className="icon-btn"
        title="AI rewrite"
        aria-label="AI rewrite"
        style={{ height: PANEL.btnHeight - 4, minWidth: PANEL.btnHeight - 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Sparkles size={PANEL.iconSizeSm - 1} />
      </button>
    ),
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const trimmed = s.textContent.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const toggles: {
        key: "bold" | "italic";
        icon: ReactNode;
        title: string;
      }[] = [
        { key: "bold", icon: <Bold size={PANEL.iconSizeSm} />, title: "Bold" },
        { key: "italic", icon: <Italic size={PANEL.iconSizeSm} />, title: "Italic" },
      ];
      return (
        <div className="flex flex-col gap-1.5">
          <AutoTextarea
            value={s.textContent}
            onChange={(v) => set({ textContent: v })}
            placeholder="Enter text content…"
          />
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 9, color: "var(--panel-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              {s.textContent.length}ch · {words}w
            </span>
            <div className="flex gap-[2px]">
              {toggles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`icon-btn ${s[t.key] ? "icon-btn-active" : ""}`}
                  title={t.title}
                  aria-pressed={s[t.key]}
                  style={{ height: 20, minWidth: 20 }}
                  onClick={() => set({ [t.key]: !s[t.key] })}
                >
                  {t.icon}
                </button>
              ))}
              <button
                type="button"
                className="icon-btn"
                title="Link"
                style={{ height: 20, minWidth: 20 }}
              >
                <Link2 size={PANEL.iconSizeSm} />
              </button>
            </div>
          </div>
        </div>
      );
    },
  },

  // ── 4. Tailwind ────────────────────────────────────────────────────────────
  {
    key: "tailwind",
    label: "Tailwind Classes",
    icon: Code2,
    defaultOpen: true,
    extraAction: () => (
      <button
        type="button"
        className="icon-btn"
        title="Sort classes"
        aria-label="Sort classes"
        style={{
          height: PANEL.btnHeight - 4,
          minWidth: PANEL.btnHeight - 4,
          fontSize: PANEL.iconSizeSm - 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        A→Z
      </button>
    ),
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const copy = (txt: string) => navigator.clipboard?.writeText(txt);
      return (
        <>
          <TailwindChipInput
            value={s.tailwindClasses}
            onChange={(v: string) => set({ tailwindClasses: v })}
          />
          <div className="flex gap-1 mt-1.5">
            <button
              type="button"
              className="icon-btn flex-1"
              style={{ fontSize: PANEL.iconSizeSm - 1, height: PANEL.btnHeight }}
              onClick={() => copy(`/* tailwind → css */\n${s.tailwindClasses}`)}
              title="Copy as CSS"
            >
              Copy as CSS
            </button>
            <button
              type="button"
              className="icon-btn flex-1"
              style={{ fontSize: PANEL.iconSizeSm - 1, height: PANEL.btnHeight }}
              onClick={() => copy(s.tailwindClasses)}
              title="Copy classes"
            >
              Copy classes
            </button>
          </div>
        </>
      );
    },
  },

  // ── 5. Inline CSS ──────────────────────────────────────────────────────────
  {
    key: "inlineCss",
    label: "Inline CSS",
    icon: Code2,
    defaultOpen: false,
    resetSection: "inlineCss",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      return (
        <textarea
          placeholder="color: red; display: flex;"
          rows={3}
          className="textarea-small w-full resize-none"
          value={s.inlineCss}
          onChange={(e) => set({ inlineCss: e.target.value })}
        />
      );
    },
  },

  // ── 6. Element ID ──────────────────────────────────────────────────────────
  {
    key: "elementId",
    label: "Element ID",
    icon: Hash,
    defaultOpen: false,
    resetSection: "elementId",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            <PropertyInput
              value={s.elementId}
              onChange={(v: string) => set({ elementId: v })}
              placeholder="hero-section"
              icon={<Hash size={PANEL.iconSizeSm - 1} />}
              className="flex-1"
            />
            <button
              type="button"
              className="icon-btn"
              title="Copy anchor link"
              aria-label="Copy anchor link"
              onClick={() => navigator.clipboard?.writeText(`#${s.elementId}`)}
            >
              <Copy size={PANEL.iconSizeSm} />
            </button>
          </div>
          {s.elementId && (
            <span
              style={{
                fontSize: PANEL.labelFontSize,
                color: "var(--panel-accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              #{s.elementId}
            </span>
          )}
        </div>
      );
    },
  },

  // ── 7. Margin ──────────────────────────────────────────────────────────────
  {
    key: "margin",
    label: "Margin",
    icon: Scan,
    defaultOpen: true,
    resetSection: "margin",
    render: ({ style: s, dispatch }) => (
      <BoxModelWidget
        values={s.margin}
        onChange={(v: SpacingValues) => dispatch({ type: "SET", patch: { margin: v } })}
        label="margin"
        color="var(--panel-warning)"
      />
    ),
  },

  // ── 8. Padding ─────────────────────────────────────────────────────────────
  {
    key: "padding",
    label: "Padding",
    icon: Square,
    defaultOpen: true,
    resetSection: "padding",
    render: ({ style: s, dispatch }) => (
      <BoxModelWidget
        values={s.padding}
        onChange={(v: SpacingValues) => dispatch({ type: "SET", patch: { padding: v } })}
        label="padding"
        color="var(--panel-success)"
      />
    ),
  },

  // ── 9. Position ────────────────────────────────────────────────────────────
  {
    key: "position",
    label: "Position",
    icon: CornerUpLeft,
    defaultOpen: false,
    resetSection: "position",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const setPos = (p: Partial<SpacingValues>) =>
        set({ position: { ...s.position, ...p } });
      return (
        <div className="flex flex-col gap-1.5">
          <PositionTypeSelector
            value={(s.posType || "static") as PosType}
            onChange={(v: PosType) => set({ posType: v })}
          />
          {s.posType && s.posType !== "static" && (
            <div className="grid grid-cols-2 gap-1.5">
              <PropertyInput
                value={s.position.t}
                onChange={(v: string) => setPos({ t: v })}
                placeholder="—"
                label="T"
              />
              <PropertyInput
                value={s.position.r}
                onChange={(v: string) => setPos({ r: v })}
                placeholder="—"
                label="R"
              />
              <PropertyInput
                value={s.position.b}
                onChange={(v: string) => setPos({ b: v })}
                placeholder="—"
                label="B"
              />
              <PropertyInput
                value={s.position.l}
                onChange={(v: string) => setPos({ l: v })}
                placeholder="—"
                label="L"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <PropertySelect
              value={s.zIndex}
              onValueChange={(v: string) => set({ zIndex: v })}
              placeholder="Z-Index"
              options={Z_OPTIONS}
              icon={<Layers size={PANEL.iconSizeSm} />}
            />
            <PropertySelect
              value={s.pointerEvents}
              onValueChange={(v: string) => set({ pointerEvents: v })}
              placeholder="Pointer"
              options={POINTER_OPTIONS}
              icon={<MousePointer2 size={PANEL.iconSizeSm} />}
            />
          </div>
        </div>
      );
    },
  },

  // ── 10. Size ───────────────────────────────────────────────────────────────
  {
    key: "size",
    label: "Size",
    icon: Maximize2,
    defaultOpen: true,
    resetSection: "size",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      // Aspect ratio is derived from current w/h and stored transiently in a ref
      const ratioRef = useRef<number | undefined>(undefined);
      const applyAspect = (which: "width" | "height", value: string) => {
        if (!s.aspectLock || ratioRef.current === undefined) {
          set({ [which]: value });
          return;
        }
        const n = parseFloat(value);
        if (!Number.isFinite(n)) { set({ [which]: value }); return; }
        if (which === "width")
          set({ width: value, height: String(Math.round(n / ratioRef.current)) });
        else
          set({ height: value, width: String(Math.round(n * ratioRef.current)) });
      };
      const toggleLock = () => {
        const w = parseFloat(s.width);
        const h = parseFloat(s.height);
        if (!s.aspectLock && Number.isFinite(w) && Number.isFinite(h) && h !== 0) {
          ratioRef.current = w / h;
          set({ aspectLock: true });
        } else {
          ratioRef.current = undefined;
          set({ aspectLock: !s.aspectLock });
        }
      };
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1">
            <PropertyInput
              value={s.width}
              onChange={(v: string) => applyAspect("width", v)}
              icon={<UnfoldHorizontal size={PANEL.iconSizeSm} />}
              placeholder="Width"
              className="flex-1"
            />
            <button
              type="button"
              className={`icon-btn ${s.aspectLock ? "icon-btn-active" : ""}`}
              onClick={toggleLock}
              title={s.aspectLock ? "Unlock aspect ratio" : "Lock aspect ratio"}
              aria-label="Toggle aspect ratio lock"
              aria-pressed={s.aspectLock}
              style={{ height: PANEL.btnHeight, minWidth: PANEL.btnHeight }}
            >
              {s.aspectLock ? (
                <LinkIcon size={PANEL.iconSizeSm - 1} />
              ) : (
                <Unlink size={PANEL.iconSizeSm - 1} />
              )}
            </button>
            <PropertyInput
              value={s.height}
              onChange={(v: string) => applyAspect("height", v)}
              icon={<UnfoldVertical size={PANEL.iconSizeSm} />}
              placeholder="Height"
              className="flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-[3px]">
            {["Auto", "Full", "Screen", "Fit"].map((p) => (
              <button
                key={p}
                type="button"
                className="icon-btn"
                style={{
                  height: PANEL.btnHeight,
                  fontSize: PANEL.labelFontSize,
                  padding: "0 7px",
                }}
                onClick={() => {
                  const lower = p.toLowerCase();
                  set({ width: lower, ...(s.aspectLock ? {} : { height: lower }) });
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      );
    },
  },

  // ── 11. Max / Min ──────────────────────────────────────────────────────────
  {
    key: "maxSize",
    label: "Max / Min Size",
    icon: UnfoldHorizontal,
    defaultOpen: false,
    resetSection: "maxSize",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      return (
        <div className="flex flex-col gap-1.5">
          <SubLabel>Max</SubLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <PropertySelect
              value={s.maxWidth}
              onValueChange={(v: string) => set({ maxWidth: v })}
              placeholder="Max W"
              options={MAX_W_OPTIONS}
              icon={<UnfoldHorizontal size={PANEL.iconSizeSm} />}
            />
            <PropertyInput
              value={s.maxHeight}
              onChange={(v: string) => set({ maxHeight: v })}
              placeholder="Max H"
              icon={<UnfoldVertical size={PANEL.iconSizeSm} />}
            />
          </div>
          <SubLabel>Min</SubLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <PropertyInput
              value={s.minWidth}
              onChange={(v: string) => set({ minWidth: v })}
              placeholder="Min W"
              icon={<UnfoldHorizontal size={PANEL.iconSizeSm} />}
            />
            <PropertyInput
              value={s.minHeight}
              onChange={(v: string) => set({ minHeight: v })}
              placeholder="Min H"
              icon={<UnfoldVertical size={PANEL.iconSizeSm} />}
            />
          </div>
        </div>
      );
    },
  },

  // ── 12. Spacing (Gap) ──────────────────────────────────────────────────────
  {
    key: "spacing",
    label: "Spacing",
    icon: LayoutGrid,
    defaultOpen: false,
    resetSection: "spacing",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const previewStyle: CSSProperties = {
        height: 32,
        background: "var(--panel-surface)",
        border: "1px solid var(--panel-border-soft)",
        borderRadius: 5,
        gap: `${tokenToPx(s.gapX)}px`,
        overflow: "hidden",
      };
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-center" style={previewStyle}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 18,
                  borderRadius: 3,
                  background: "var(--panel-elevated)",
                  border: "1px solid var(--panel-border)",
                }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <PropertySelect
              value={s.gapX}
              onValueChange={(v: string) => set({ gapX: v })}
              placeholder="Gap X"
              options={SPACING_OPTIONS}
              icon={<MoveHorizontal size={PANEL.iconSizeSm} />}
            />
            <PropertySelect
              value={s.gapY}
              onValueChange={(v: string) => set({ gapY: v })}
              placeholder="Gap Y"
              options={SPACING_OPTIONS}
              icon={<MoveVertical size={PANEL.iconSizeSm} />}
            />
          </div>
        </div>
      );
    },
  },

  // ── 13. Alignment ──────────────────────────────────────────────────────────
  {
    key: "alignment",
    label: "Alignment",
    icon: AlignCenter,
    defaultOpen: true,
    resetSection: "alignment",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const flexLike = s.display === "flex" || s.display === "inline-flex";
      const layoutLike = flexLike || s.display === "grid";
      const textAlignBtns: { v: string; icon: ReactNode }[] = [
        { v: "left", icon: <AlignLeft size={13} /> },
        { v: "center", icon: <AlignCenter size={13} /> },
        { v: "right", icon: <AlignRight size={13} /> },
        { v: "justify", icon: <AlignJustify size={13} /> },
      ];
      return (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <PropertySelect
              value={s.display}
              onValueChange={(v: string) => set({ display: v })}
              placeholder="Display"
              options={DISPLAY_OPTIONS}
            />
            {flexLike && (
              <PropertySelect
                value={s.flexDirection}
                onValueChange={(v: string) => set({ flexDirection: v })}
                placeholder="Direction"
                options={DIRECTION_OPTIONS}
              />
            )}
          </div>
          {layoutLike && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <PropertySelect
                  value={s.justifyContent}
                  onValueChange={(v: string) => set({ justifyContent: v })}
                  placeholder="Justify"
                  options={JUSTIFY_OPTIONS}
                />
                <PropertySelect
                  value={s.alignItems}
                  onValueChange={(v: string) => set({ alignItems: v })}
                  placeholder="Align"
                  options={ALIGN_OPTIONS}
                />
              </div>
              <div className="flex items-center gap-2">
                <AlignmentGrid
                  value={s.alignPos}
                  onChange={(v: string) => set({ alignPos: v })}
                />
                <div className="flex flex-col gap-[3px]">
                  <button
                    type="button"
                    className={`icon-btn ${s.flexWrap ? "icon-btn-active" : ""}`}
                    onClick={() => set({ flexWrap: !s.flexWrap })}
                    title="Toggle flex wrap"
                    aria-pressed={s.flexWrap}
                    style={{
                      height: PANEL.btnHeight,
                      fontSize: PANEL.iconSizeSm - 1,
                      padding: "0 6px",
                    }}
                  >
                    Wrap
                  </button>
                </div>
              </div>
            </>
          )}
          <div>
            <SubLabel>Text Align</SubLabel>
            <div className="flex gap-[2px]">
              {textAlignBtns.map(({ v, icon }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set({ textAlign: s.textAlign === v ? "" : v })}
                  className={`icon-btn ${s.textAlign === v ? "icon-btn-active" : ""}`}
                  title={v}
                  aria-pressed={s.textAlign === v}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    },
  },

  // ── 14. Typography ─────────────────────────────────────────────────────────
  {
    key: "typography",
    label: "Typography",
    icon: Type,
    defaultOpen: true,
    resetSection: "typography",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const toggles: {
        key: "bold" | "italic" | "underline" | "strikethrough";
        icon: ReactNode;
        title: string;
      }[] = [
        { key: "bold", icon: <Bold size={13} />, title: "Bold" },
        { key: "italic", icon: <Italic size={13} />, title: "Italic" },
        { key: "underline", icon: <Underline size={13} />, title: "Underline" },
        { key: "strikethrough", icon: <Strikethrough size={13} />, title: "Strikethrough" },
      ];
      return (
        <div className="flex flex-col gap-1.5">
          <PropertySelect
            value={s.fontFamily}
            onValueChange={(v: string) => set({ fontFamily: v })}
            placeholder="Font Family"
            options={FONT_FAMILY_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <PropertySelect
              value={s.fontSize}
              onValueChange={(v: string) => set({ fontSize: v })}
              placeholder="Size"
              options={FONT_SIZE_OPTIONS}
            />
            <PropertySelect
              value={s.fontWeight}
              onValueChange={(v: string) => set({ fontWeight: v })}
              placeholder="Weight"
              options={FONT_WEIGHT_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <PropertyInput
              value={s.lineHeight}
              onChange={(v: string) => set({ lineHeight: v })}
              placeholder="Line Height"
              unit="lh"
            />
            <PropertyInput
              value={s.letterSpacing}
              onChange={(v: string) => set({ letterSpacing: v })}
              placeholder="Tracking"
              unit="em"
            />
          </div>
          <ColorPicker
            value={s.textColor}
            onChange={(v: string) => set({ textColor: v })}
            label="Color"
          />
          <div className="flex gap-[2px]">
            {toggles.map(({ key, icon, title }) => (
              <button
                key={key}
                type="button"
                className={`icon-btn ${s[key] ? "icon-btn-active" : ""}`}
                onClick={() => set({ [key]: !s[key] })}
                title={title}
                aria-pressed={s[key]}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      );
    },
  },

  // ── 15. Appearance ────────────────────────────���────────────────────────────
  {
    key: "appearance",
    label: "Appearance",
    icon: Eye,
    defaultOpen: true,
    resetSection: "appearance",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      return (
        <div className="flex flex-col gap-1.5">
          <div>
            <div className="flex justify-between mb-1">
              <SubLabel>Opacity</SubLabel>
              <span
                style={{
                  fontSize: PANEL.labelFontSize,
                  color: "var(--panel-fg)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s.opacity[0]}%
              </span>
            </div>
            <Slider
              value={s.opacity}
              onValueChange={(v) => set({ opacity: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <PropertySelect
              value={s.overflow}
              onValueChange={(v: string) => set({ overflow: v })}
              placeholder="Overflow"
              options={OVERFLOW_OPTIONS}
            />
            <PropertySelect
              value={s.cursor}
              onValueChange={(v: string) => set({ cursor: v })}
              placeholder="Cursor"
              options={CURSOR_OPTIONS}
            />
          </div>
          <div>
            <SubLabel>Visibility</SubLabel>
            <SegmentedControl
              value={s.visibility}
              onChange={(v: VisibilityValue) => set({ visibility: v })}
              options={[
                { value: "visible", label: "Visible", icon: <Eye size={PANEL.iconSizeSm - 1} /> },
                { value: "hidden", label: "Hidden", icon: <EyeOff size={PANEL.iconSizeSm - 1} /> },
                { value: "none", label: "None", icon: <Minus size={PANEL.iconSizeSm - 1} /> },
              ]}
            />
          </div>
        </div>
      );
    },
  },

  // ── 16. Background ─────────────────────────────────────────────────────────
  {
    key: "background",
    label: "Background",
    icon: Palette,
    defaultOpen: true,
    resetSection: "background",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      return (
        <div className="flex flex-col gap-1.5">
          <SegmentedControl
            value={s.bgTab}
            onChange={(v: BgTab) => set({ bgTab: v })}
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
              { value: "image", label: "Image" },
            ]}
          />
          {s.bgTab === "solid" && (
            <ColorPicker
              value={s.bgColor}
              onChange={(v: string) => set({ bgColor: v })}
              label="Color"
            />
          )}
          {s.bgTab === "gradient" && (
            <span
              style={{ fontSize: PANEL.labelFontSize, color: "var(--panel-muted)" }}
            >
              Gradient editor coming soon
            </span>
          )}
          {s.bgTab === "image" && (
            <>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="url(…) or image path"
                  className="panel-input flex-1"
                  value={s.bgImage}
                  onChange={(e) => set({ bgImage: e.target.value })}
                />
                <button
                  type="button"
                  className="icon-btn"
                  title="Upload image"
                  aria-label="Upload image"
                >
                  <ImageIcon size={PANEL.iconSize} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <PropertySelect
                  value={s.bgSize}
                  onValueChange={(v: string) => set({ bgSize: v })}
                  placeholder="Size"
                  options={BG_SIZE_OPTIONS}
                />
                <PropertySelect
                  value={s.bgPosition}
                  onValueChange={(v: string) => set({ bgPosition: v })}
                  placeholder="Position"
                  options={BG_POS_OPTIONS}
                />
              </div>
            </>
          )}
        </div>
      );
    },
  },

  // ── 17. Embed ──────────────────────────────────────────────────────────────
  {
    key: "embed",
    label: "Embed",
    icon: Frame,
    defaultOpen: false,
    resetSection: "embed",
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      return (
        <div className="flex flex-col gap-1.5">
          <textarea
            placeholder="Paste iframe, YouTube, Vimeo, Twitter URL or embed code…"
            rows={3}
            className="textarea-small w-full resize-none"
            value={s.embedCode}
            onChange={(e) => set({ embedCode: e.target.value })}
          />
          {s.embedCode && (
            <div
              className="flex items-center gap-1"
              style={{
                background: "var(--panel-surface)",
                border: "1px solid var(--panel-border-soft)",
                borderRadius: 5,
                padding: 6,
                fontSize: PANEL.labelFontSize,
                color: "var(--panel-muted)",
              }}
            >
              <ArrowUpRight size={PANEL.iconSizeSm - 1} />
              Preview available after save
            </div>
          )}
        </div>
      );
    },
  },

  // ── 18. Border ─────────────────────────────────────────────────────────────
  {
    key: "border",
    label: "Border",
    icon: Square,
    defaultOpen: true,
    resetSection: "border",
    badge: (s) =>
      s.borderWidth || s.borderStyle || s.borderColor ? "set" : undefined,
    render: ({ style: s, dispatch }) => {
      const set = (patch: Partial<ElementStyle>) => dispatch({ type: "SET", patch });
      const corners: {
        key: "borderRadiusTL" | "borderRadiusTR" | "borderRadiusBL" | "borderRadiusBR";
        label: string;
      }[] = [
        { key: "borderRadiusTL", label: "TL" },
        { key: "borderRadiusTR", label: "TR" },
        { key: "borderRadiusBL", label: "BL" },
        { key: "borderRadiusBR", label: "BR" },
      ];
      const showPreview = Boolean(s.borderWidth || s.borderStyle || s.borderColor);
      return (
        <div className="flex flex-col gap-1.5">
          {showPreview && (
            <div
              className="flex items-center"
              style={{
                height: 26,
                borderRadius: 2,
                background: "var(--panel-surface)",
                border: `${s.borderWidth || "1"}px ${s.borderStyle || "solid"} ${s.borderColor || "var(--panel-border)"}`,
                paddingLeft: 8,
              }}
            >
              <span
                style={{ fontSize: PANEL.iconSizeSm - 1, color: "var(--panel-muted)" }}
              >
                preview
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <PropertyInput
              value={s.borderWidth}
              onChange={(v: string) => set({ borderWidth: v })}
              placeholder="Width"
              unit="px"
            />
            <PropertySelect
              value={s.borderStyle}
              onValueChange={(v: string) => set({ borderStyle: v })}
              placeholder="Style"
              options={BORDER_STYLE_OPTIONS}
            />
          </div>
          <ColorPicker
            value={s.borderColor}
            onChange={(v: string) => set({ borderColor: v })}
            label="Color"
          />
          <div>
            <SubLabel>Border Radius</SubLabel>
            <PropertySelect
              value={s.borderRadius}
              onValueChange={(v: string) => set({ borderRadius: v })}
              placeholder="Radius"
              options={BORDER_RADIUS_OPTIONS}
              icon={<RotateCw size={PANEL.iconSizeSm} />}
            />
          </div>
          <div>
            <SubLabel>Per corner</SubLabel>
            <div className="grid grid-cols-2 gap-1">
              {corners.map((c) => (
                <div key={c.key} className="flex items-center gap-1">
                  <span
                    style={{
                      fontSize: PANEL.iconSizeSm - 1,
                      color: "var(--panel-muted)",
                      width: 14,
                    }}
                  >
                    {c.label}
                  </span>
                  <input
                    type="text"
                    className="panel-input flex-1 w-full"
                    placeholder="—"
                    value={s[c.key]}
                    onChange={(e) => set({ [c.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    },
  },
];

// ─── Group configs ────────────────────────────────────────────────────────────
// Maps top-level category groups to the section keys they contain.
// Order here defines the render order of both groups and sections within them.

export type GroupKey =
  | "general"
  | "layout"
  | "spacing"
  | "typography"
  | "visual"
  | "advanced";

interface GroupConfig {
  key: GroupKey;
  label: string;
  /** Accent stripe color (matches instrument-panel palette) */
  accent: string;
  sections: SectionKeys[];
  defaultOpen: boolean;
}

const GROUP_CONFIGS: GroupConfig[] = [
  {
    key: "general",
    label: "General",
    accent: "#E4573D",      // copper — primary brand
    defaultOpen: true,
    sections: ["family", "elementId", "link", "embed"],
  },
  {
    key: "layout",
    label: "Layout",
    accent: "#34D399",      // emerald — structure/placement
    defaultOpen: true,
    sections: ["position", "size", "maxSize", "alignment", "spacing"],
  },
  {
    key: "spacing",
    label: "Spacing",
    accent: "#F5A623",      // amber — box model
    defaultOpen: true,
    sections: ["margin", "padding"],
  },
  {
    key: "typography",
    label: "Typography",
    accent: "#A78BFA",      // violet — text
    defaultOpen: true,
    sections: ["textContent", "typography"],
  },
  {
    key: "visual",
    label: "Visual",
    accent: "#60A5FA",      // blue — appearance
    defaultOpen: true,
    sections: ["background", "border", "appearance"],
  },
  {
    key: "advanced",
    label: "Advanced",
    accent: "#94A3B8",      // slate — dev tools
    defaultOpen: false,
    sections: ["tailwind", "inlineCss"],
  },
];

// ─── SectionShell (memoised) ──────────────────────────────────────────────────

interface SectionShellProps {
  config: SectionConfig;
  isOpen: boolean;
  onToggle: () => void;
  ctx: SectionRenderCtx;
}

const SectionShell = memo(function SectionShell({
  config,
  isOpen,
  onToggle,
  ctx,
}: SectionShellProps) {
  const { style, dispatch } = ctx;
  const Icon = config.icon;
  const badge = config.badge?.(style);

  const reset =
    config.resetSection &&
    (() => dispatch({ type: "RESET_SECTION", section: config.resetSection as SectionKeys }));

  const actions = (
    <>
      {config.extraAction?.(ctx)}
      {reset && <SectionResetButton onReset={reset} />}
    </>
  );

  return (
    <PropertySection
      label={config.label}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<Icon size={PANEL.iconSizeSm} />}
      badge={badge}
      actions={actions}
    >
      {config.render(ctx)}
    </PropertySection>
  );
});

// ─── Open-sections state ──────────────────────────────────────────────────────

function useMemoState<T>(initial: T) {
  const [s, d] = useReducer(
    (prev: T, next: T | ((p: T) => T)) =>
      typeof next === "function" ? (next as (p: T) => T)(prev) : next,
    initial
  );
  return [s, d as (v: T | ((p: T) => T)) => void] as const;
}

function useOpenSections() {
  const initial = useMemo<Record<SectionKeys, boolean>>(() => {
    const acc = {} as Record<SectionKeys, boolean>;
    for (const s of SECTIONS) acc[s.key] = s.defaultOpen;
    return acc;
  }, []);
  const [openSections, setOpenSections] = useMemoState(initial);
  const toggle = useCallback(
    (k: SectionKeys) => setOpenSections((p) => ({ ...p, [k]: !p[k] })),
    [setOpenSections]
  );
  const toggleAll = useCallback(() => {
    setOpenSections((prev) => {
      const allOpen = Object.values(prev).every(Boolean);
      const next = {} as Record<SectionKeys, boolean>;
      for (const k of Object.keys(prev) as SectionKeys[]) next[k] = !allOpen;
      return next;
    });
  }, [setOpenSections]);
  return { openSections, toggle, toggleAll };
}

function useOpenGroups() {
  const initial = useMemo<Record<GroupKey, boolean>>(() => {
    const acc = {} as Record<GroupKey, boolean>;
    for (const g of GROUP_CONFIGS) acc[g.key] = g.defaultOpen;
    return acc;
  }, []);
  const [openGroups, setOpenGroups] = useMemoState(initial);
  const toggleGroup = useCallback(
    (k: GroupKey) => setOpenGroups((p) => ({ ...p, [k]: !p[k] })),
    [setOpenGroups]
  );
  return { openGroups, toggleGroup };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ElementProperties({
  value,
  onChange,
  familyElements = DEFAULT_FAMILY_ELEMENTS,
  onElementSelect,
}: ElementPropertiesProps) {
  const isControlled = value !== undefined;

  const [internalState, dispatchInternal] = useReducer(
    reducer,
    (value as ElementStyle | undefined) ?? INITIAL_STYLE
  );

  // Sync controlled value downward
  const lastValueRef = useRef(value);
  if (isControlled && value !== lastValueRef.current) {
    lastValueRef.current = value;
    const next = { ...INITIAL_STYLE, ...value } as ElementStyle;
    if (next !== internalState)
      dispatchInternal({ type: "REPLACE", state: next });
  }

  const style = isControlled
    ? ({ ...INITIAL_STYLE, ...value } as ElementStyle)
    : internalState;

  const dispatch = useCallback(
    (action: Action) => {
      const next = reducer(style, action);
      dispatchInternal(action);
      onChange?.(next);
    },
    [style, onChange]
  );

  const { openSections, toggle, toggleAll } = useOpenSections();
  const { openGroups, toggleGroup } = useOpenGroups();

  // Build a lookup map for O(1) section config access
  const sectionMap = useMemo<Record<SectionKeys, SectionConfig>>(() => {
    const m = {} as Record<SectionKeys, SectionConfig>;
    for (const s of SECTIONS) m[s.key] = s;
    return m;
  }, []);

  const ctx = useMemo<SectionRenderCtx>(
    () => ({ style, dispatch, familyElements, onElementSelect }),
    [style, dispatch, familyElements, onElementSelect]
  );

  return (
    <div className="property-panel" style={{ fontFamily: "var(--font-mono)" }}>
      <PanelHeader onToggleAll={toggleAll} />
      {GROUP_CONFIGS.map((group) => (
        <div key={group.key}>
          <GroupHeader
            label={group.label}
            isOpen={openGroups[group.key]}
            onToggle={() => toggleGroup(group.key)}
            count={group.sections.length}
            accent={group.accent}
          />
          {openGroups[group.key] && (
            <div className="group-body">
              {group.sections.map((sectionKey) => {
                const config = sectionMap[sectionKey];
                if (!config) return null;
                return (
                  <SectionShell
                    key={config.key}
                    config={config}
                    isOpen={openSections[config.key]}
                    onToggle={() => toggle(config.key)}
                    ctx={ctx}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div style={{ height: 40 }} />
    </div>
  );
}

export default ElementProperties;
