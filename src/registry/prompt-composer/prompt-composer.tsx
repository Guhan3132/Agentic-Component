"use client";

import { ArrowUp, Check, ChevronDown, ChevronLeft, ChevronRight, Mic, Plus, Search, Square, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Effort = "Low" | "Medium" | "High" | "Max";

export type ComposerModel = {
  id: string;
  name: string;
  hint?: string;
  /** Effort levels this model supports. Defaults to all four. */
  efforts?: Effort[];
  defaultEffort?: Effort;
  /** Selected first when nothing else is chosen. */
  default?: boolean;
};

export type ContextOption = { tag: string; hint: string };

/** A "/" command. Built-in ones switch mode, open the model menu, attach files and clear the box. */
export type SlashCommand = { name: string; hint: string; run: () => void };

export type ComposerSubmission = {
  text: string;
  files: File[];
  mode: string;
  modelId: string;
  modelName: string;
  effort: Effort;
  auto: boolean;
};

type Props = {
  onSubmit: (submission: ComposerSubmission) => void;
  onStop?: () => void;
  /** While generating, Send becomes Stop. */
  status?: "idle" | "generating";
  /** Keep Send live while generating (to steer a running agent); Stop then sits beside it. */
  steerable?: boolean;
  /** Modes switched with /plan, /ask, /build. The last one is the default. */
  modes?: string[];
  models?: ComposerModel[];
  /** Extra "/" commands, added after the built-in ones. */
  commands?: SlashCommand[];
  /** Options for the "@" mention menu. */
  contextOptions?: ContextOption[];
  suggestions?: string[];
  /** Show the mode and model row under the box. Turn off for a compact box, for example inside a chat. */
  controls?: boolean;
  maxLength?: number;
  placeholder?: string;
  defaultValue?: string;
  defaultFiles?: File[];
  className?: string;
};

const ALL_EFFORTS: Effort[] = ["Low", "Medium", "High", "Max"];

const DEFAULT_MODELS: ComposerModel[] = [
  { id: "swift", name: "Swift", hint: "Fastest", efforts: ["Low", "Medium"], defaultEffort: "Low" },
  { id: "balanced", name: "Balanced", hint: "Default", default: true, defaultEffort: "Medium" },
  { id: "deep", name: "Deep", hint: "Slower", efforts: ["Medium", "High", "Max"], defaultEffort: "High" },
  { id: "vision", name: "Vision", hint: "Images", defaultEffort: "Medium" },
];

const DEFAULT_CONTEXT: ContextOption[] = [
  { tag: "@codebase", hint: "Your project files" },
  { tag: "@docs", hint: "Reference material" },
  { tag: "@terminal", hint: "Last command output" },
];

const kb = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
/** Models listed directly in the menu; any beyond this are under "More models". */
const MAIN_MODELS = 5;
const ITEM = "[data-item]:not(:disabled)";

/** Move focus between `data-item` elements with the arrow keys. Returns true if it handled the key. */
function moveFocus(root: HTMLElement | null, e: React.KeyboardEvent) {
  const items = root ? [...root.querySelectorAll<HTMLElement>(ITEM)] : [];
  if (!items.length) return false;
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (e.key === "ArrowDown") items[(i + 1) % items.length].focus();
  else if (e.key === "ArrowUp") items[(i - 1 + items.length) % items.length].focus();
  else if (e.key === "Home") items[0].focus();
  else if (e.key === "End") items[items.length - 1].focus();
  else return false;
  e.preventDefault();
  return true;
}

// Voice dictation uses the browser's speech recognition where it exists; the mic is hidden elsewhere.
interface Recognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
const getRecognizer = (): (new () => Recognizer) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Preview URLs for image attachments, released when the files change or the component unmounts. */
function useObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  useEffect(() => {
    const next = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null));
    // Object URLs are an external resource that has to be created and released with the files.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next);
    return () => next.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}

type Row = { key: string; label: string; hint: string; checked?: boolean };

/**
 * Prompt composer in the style of a chat app: "+" for attachments, the message, then mic and send.
 * Type "/" for commands (mode, model, attach) and "@" for context; paste images to attach them.
 * Mode (left) and model (right) sit in a row under the box, and both can be changed with a tap or
 * from the keyboard. Layout follows the component's own
 * width (container queries): on a narrow width the message gets its own row, targets are 44px and
 * text is 16px (so iOS does not zoom in on focus).
 */
export function PromptComposer({
  onSubmit,
  onStop,
  status = "idle",
  steerable = false,
  modes = ["Plan", "Ask", "Build"],
  models: modelList = DEFAULT_MODELS,
  commands: extraCommands = [],
  contextOptions = DEFAULT_CONTEXT,
  suggestions = [],
  controls = true,
  maxLength = 4000,
  placeholder = "Plan, build or ask. / for commands, @ for context",
  defaultValue = "",
  defaultFiles = [],
  className,
}: Props) {
  const [text, setText] = useState(defaultValue);
  const [files, setFiles] = useState<File[]>(defaultFiles);
  const [mode, setMode] = useState(modes[modes.length - 1]);
  const [modelId, setModelId] = useState(modelList.find((m) => m.default)?.id ?? modelList[0].id);
  const [efforts, setEfforts] = useState<Record<string, Effort>>({});
  const [auto, setAuto] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<null | "mode" | "model">(null);
  const [view, setView] = useState<"main" | "effort" | "more">("main");
  const [pick, setPick] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  // False on the server and during hydration, then the real answer, with no effect and no flash of the wrong state.
  const canRecord = useSyncExternalStore(
    () => () => {},
    () => !!getRecognizer(),
    () => false,
  );

  const root = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const openPicker = useCallback(() => picker.current?.click(), []);
  const pop = useRef<HTMLDivElement>(null);
  const modeBtn = useRef<HTMLButtonElement>(null);
  const modelBtn = useRef<HTMLButtonElement>(null);
  const rec = useRef<Recognizer | null>(null);
  const urls = useObjectUrls(files);

  const generating = status === "generating";
  const over = text.length > maxLength;
  const empty = !text.trim() && files.length === 0;
  const canSend = !empty && !over && (!generating || steerable);

  const model = modelList.find((m) => m.id === modelId) ?? modelList[0];
  const supported = model.efforts ?? ALL_EFFORTS;
  const effort = efforts[model.id] ?? model.defaultEffort ?? "Medium";

  // Each menu opens above its own button: mode on the left edge, model on the right edge.
  const openMenu = (which: "mode" | "model") => {
    if (menu === which) return setMenu(null);
    setQuery("");
    setView("main");
    setMenu(which);
  };

  const closeMenu = () => {
    const trigger = menu === "mode" ? modeBtn.current : modelBtn.current;
    setMenu(null);
    trigger?.focus();
  };

  const chooseModel = (id: string) => {
    setModelId(id);
    setAuto(false);
    closeMenu();
  };

  // "/" commands: only when the whole message is a slash word. "@" mentions: the word at the end.
  const slash = /^\/(\w*)$/.exec(text);
  const mention = /(^|\s)@(\w*)$/.exec(text);

  const commands: SlashCommand[] = [
    ...(controls
      ? [
          ...modes.map((m) => ({ name: m.toLowerCase(), hint: `Switch to ${m} mode`, run: () => setMode(m) })),
          { name: "model", hint: "Choose a model and effort", run: () => openMenu("model") },
        ]
      : []),
    { name: "attach", hint: "Add files or images", run: openPicker },
    { name: "clear", hint: "Clear message and files", run: () => setFiles([]) },
    ...extraCommands,
  ];

  // Filtering only reads each command's name. The "attach" command touches the file input's ref, but only when it is run from an event.
  // eslint-disable-next-line react-hooks/refs
  const slashRows = slash ? commands.filter((c) => c.name.startsWith(slash[1].toLowerCase())) : [];
  const mentionRows = useMemo(
    () => (mention ? contextOptions.filter((o) => o.tag.toLowerCase().startsWith(`@${mention[2].toLowerCase()}`)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mention?.[2], contextOptions],
  );

  const kind: "slash" | "mention" | null = slash && slashRows.length ? "slash" : mention && mentionRows.length ? "mention" : null;
  const suggestOpen = !!kind && !dismissed && !generating;
  const rows: Row[] =
    kind === "slash"
      ? slashRows.map((c) => ({ key: c.name, label: `/${c.name}`, hint: c.hint, checked: c.name === mode.toLowerCase() }))
      : mentionRows.map((o) => ({ key: o.tag, label: o.tag, hint: o.hint }));

  const choose = (i: number) => {
    if (kind === "slash") {
      const c = slashRows[i];
      setText("");
      c?.run();
    } else if (kind === "mention") {
      const o = mentionRows[i];
      if (o) setText((t) => t.replace(/(^|\s)@\w*$/, (_, lead: string) => `${lead}${o.tag} `));
      area.current?.focus();
    }
    setPick(0);
  };

  const moreModels = modelList.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()));

  // Grow with the text up to about six lines; only then allow (hidden) scrolling.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 168;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [text]);

  // Close the menu on outside press; move focus into it when it opens.
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("pointerdown", away);
    const id = setTimeout(() => {
      const el = pop.current;
      (el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(ITEM))?.focus({ preventScroll: true });
    }, 40);
    return () => {
      document.removeEventListener("pointerdown", away);
      clearTimeout(id);
    };
  }, [menu, view]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => () => rec.current?.stop(), []);

  const send = () => {
    if (!canSend) return;
    onSubmit({ text: text.trim(), files, mode, modelId: model.id, modelName: model.name, effort, auto });
    setText("");
    setFiles([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestOpen) {
      const go = (fn: () => void) => {
        e.preventDefault();
        fn();
      };
      if (e.key === "ArrowDown") return go(() => setPick((i) => (i + 1) % rows.length));
      if (e.key === "ArrowUp") return go(() => setPick((i) => (i - 1 + rows.length) % rows.length));
      if (e.key === "Enter" || e.key === "Tab") return go(() => choose(pick));
      if (e.key === "Escape") return go(() => setDismissed(true));
    }
    // Enter sends, Shift+Enter adds a line. Ignore Enter that confirms an IME composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const addFiles = (list: FileList | File[] | null) => {
    const picked = list ? Array.from(list) : [];
    if (!picked.length) return;
    setFiles((cur) => [...cur, ...picked]);
    if (picker.current) picker.current.value = "";
  };

  const toggleRecording = () => {
    if (recording) {
      rec.current?.stop();
      return;
    }
    const Ctor = getRecognizer();
    if (!Ctor) return;
    try {
      const r = new Ctor();
      r.continuous = true;
      r.interimResults = false;
      r.lang = navigator.language;
      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) setText((t) => `${t ? `${t} ` : ""}${e.results[i][0].transcript.trim()}`);
        }
      };
      r.onend = () => setRecording(false);
      r.onerror = () => setRecording(false);
      rec.current = r;
      setSeconds(0);
      setRecording(true);
      r.start();
    } catch {
      setRecording(false);
    }
  };

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div ref={root} className={cn("@container w-full", className)}>
      {suggestions.length > 0 && empty && !generating && (
        <div className={cn("-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1 @md:flex-wrap @md:overflow-visible", NO_SCROLLBAR)}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setText(s);
                area.current?.focus();
              }}
              className="shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground/80 hover:border-foreground/30 @md:py-1.5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="relative rounded-3xl border border-border bg-card p-2.5 shadow-sm focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/10 @md:p-3"
      >
        {/* "/" commands and "@" mentions */}
        <AnimatePresence>
          {suggestOpen && (
            <Popover popRef={pop} label={kind === "slash" ? "Commands" : "Add context"} origin="24px 100%" className="left-0 w-72 max-w-[calc(100%-1rem)]" role="listbox">
              {rows.map((r, i) => (
                <button
                  key={r.key}
                  type="button"
                  role="option"
                  aria-selected={i === pick}
                  onMouseEnter={() => setPick(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm @md:py-2", i === pick && "bg-muted")}
                >
                  <span className="font-medium text-foreground">{r.label}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-xs text-muted-foreground">{r.hint}</span>
                    {r.checked && <Check size={14} className="shrink-0 text-foreground" />}
                  </span>
                </button>
              ))}
            </Popover>
          )}
        </AnimatePresence>

        {/* Attachments: image thumbnails, other files as chips */}
        <AnimatePresence initial={false}>
          {files.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              aria-label="Attachments"
              className="flex flex-wrap gap-2 overflow-hidden px-1 pb-2.5 pt-1.5"
            >
              {files.map((f, i) => {
                const remove = () => setFiles(files.filter((_, j) => j !== i));
                return urls[i] ? (
                  <li key={`${f.name}-${i}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urls[i] ?? undefined} alt={f.name} className="size-16 rounded-xl border border-border object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={remove}
                      className="absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground pointer-coarse:size-9"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ) : (
                  <li key={`${f.name}-${i}`} className="flex max-w-full items-center gap-1.5 rounded-xl bg-muted py-1.5 pl-3 pr-1.5 text-xs text-foreground">
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-muted-foreground">{kb(f.size)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={remove}
                      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground @md:size-6"
                    >
                      <X size={13} />
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        <input ref={picker} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />

        <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1 @md:flex-nowrap">
          <TipButton tip="Add files"
            type="button"
            aria-label="Add files"
            onClick={() => picker.current?.click()}
            className="group relative grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring @md:size-9"
          >
            <Plus size={20} />
            
          </TipButton>

          <textarea
            ref={area}
            value={text}
            rows={1}
            onChange={(e) => {
              setText(e.target.value);
              setDismissed(false);
              setPick(0);
            }}
            onKeyDown={onKeyDown}
            onPaste={(e) => {
              const images = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
              if (images.length) {
                e.preventDefault();
                addFiles(images);
              }
            }}
            placeholder={placeholder}
            aria-label="Message"
            aria-invalid={over}
            aria-autocomplete={suggestOpen ? "list" : undefined}
            className={cn(
              "order-first block max-h-42 w-full resize-none overflow-y-hidden bg-transparent px-2 py-2 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 @md:order-none @md:min-w-0 @md:flex-1 @md:py-1.5 @md:text-[15px]",
              NO_SCROLLBAR,
            )}
          />

          <p className="sr-only" role="status" aria-live="polite">
            {recording ? "Recording" : generating ? "Generating a reply" : ""}
          </p>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {text.length > maxLength * 0.8 && (
              <span role={over ? "alert" : undefined} className={cn("mr-1 text-xs tabular-nums", over ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                {text.length.toLocaleString()} / {maxLength.toLocaleString()}
              </span>
            )}

            {canRecord && (
              <TipButton tip={recording ? "Stop recording" : "Record"}
                type="button"
                disabled={generating}
                aria-label={recording ? "Stop recording" : "Record voice input"}
                aria-pressed={recording}
                onClick={toggleRecording}
                className={cn(
                  "group relative grid h-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40 @md:h-9",
                  recording ? "w-11 bg-rose-500/10 text-rose-600 @md:w-auto @md:px-3 dark:text-rose-400" : "w-11 @md:w-9",
                )}
              >
                {recording ? (
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 animate-pulse rounded-full bg-rose-500" />
                    <span className="hidden text-sm tabular-nums @md:inline">{time}</span>
                  </span>
                ) : (
                  <>
                    <Mic size={18} />
                    
                  </>
                )}
              </TipButton>
            )}

            {generating && steerable && (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-muted px-3.5 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring @md:h-9"
              >
                <Square size={12} className="fill-current" /> Stop
              </button>
            )}

            {generating && !steerable ? (
              <TipButton tip="Stop"
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="group relative grid size-11 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 @md:size-9"
              >
                <Square size={13} className="fill-current" />
                
              </TipButton>
            ) : (
              <TipButton tip="Send"
                type="submit"
                disabled={!canSend}
                aria-label="Send message"
                className="group relative grid size-11 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 @md:size-9"
              >
                <ArrowUp size={18} />
                
              </TipButton>
            )}
          </div>
        </div>

      </form>

      {controls && (
        <>
      {/* Under the box: mode on the left, model on the right. Both open menus; /plan, /ask, /build and /model do the same from the keyboard. Each has its own pill so it reads on any background. */}
      <div
        className="relative mt-2 flex items-center justify-between gap-2"
        onKeyDown={(e) => {
          if (!menu) return;
          if (e.key === "Escape") {
            e.stopPropagation();
            closeMenu();
            return;
          }
          if (e.key === "Tab") {
            setMenu(null);
            return;
          }
          // Number keys pick a model, like the numbers shown in the menu.
          if (menu === "model" && view === "main" && /^[1-9]$/.test(e.key)) {
            const m = modelList.slice(0, MAIN_MODELS)[Number(e.key) - 1];
            if (m) {
              e.preventDefault();
              chooseModel(m.id);
            }
            return;
          }
          moveFocus(pop.current, e);
        }}
      >
        {/* Mode menu: opens above its button, left edges aligned */}
        <AnimatePresence>
          {menu === "mode" && (
            <Popover popRef={pop} label="Mode" origin="0% 100%" className="left-0 w-44" role="menu">
              {modes.map((m) => (
                <MenuRow
                  key={m}
                  role="menuitemradio"
                  checked={m === mode}
                  autoFocus={m === mode}
                  label={m}
                  trailing={m === mode ? <Check size={15} className="text-foreground" /> : null}
                  onClick={() => {
                    setMode(m);
                    closeMenu();
                  }}
                />
              ))}
            </Popover>
          )}
        </AnimatePresence>

        {/* Model menu: opens above its button, right edges aligned. Short list, then Effort and More models. */}
        <AnimatePresence>
          {menu === "model" && (
            <Popover popRef={pop} label="Model" origin="100% 100%" className="right-0 w-72 max-w-full" role="menu">
              {view === "main" && (
                <>
                  {modelList.slice(0, MAIN_MODELS).map((m, i) => {
                    const on = !auto && m.id === model.id;
                    return (
                      <MenuRow
                        key={m.id}
                        role="menuitemradio"
                        checked={on}
                        autoFocus={on}
                        label={m.name}
                        badge={m.hint}
                        trailing={on ? <Check size={15} className="text-foreground" /> : <span className="text-sm">{i + 1}</span>}
                        onClick={() => chooseModel(m.id)}
                      />
                    );
                  })}
                  <MenuRow
                    role="menuitemradio"
                    checked={auto}
                    autoFocus={auto}
                    label="Auto"
                    badge="Picks for you"
                    trailing={auto ? <Check size={15} className="text-foreground" /> : null}
                    onClick={() => {
                      setAuto(true);
                      closeMenu();
                    }}
                  />
                  <div className="mx-2 my-1 border-t border-border" />
                  <MenuRow
                    label="Effort"
                    disabled={auto}
                    trailing={
                      <>
                        <span className="text-sm">{auto ? "Auto" : effort}</span>
                        <ChevronRight size={15} />
                      </>
                    }
                    onClick={() => setView("effort")}
                  />
                  {modelList.length > MAIN_MODELS && <MenuRow label="More models" trailing={<ChevronRight size={15} />} onClick={() => setView("more")} />}
                </>
              )}

              {view === "effort" && (
                <>
                  <MenuRow label="Effort" lead={<ChevronLeft size={16} />} onClick={() => setView("main")} />
                  <div className="mx-2 my-1 border-t border-border" />
                  {ALL_EFFORTS.map((lv) => (
                    <MenuRow
                      key={lv}
                      role="menuitemradio"
                      checked={effort === lv}
                      autoFocus={effort === lv}
                      disabled={!supported.includes(lv)}
                      label={lv}
                      trailing={effort === lv ? <Check size={15} className="text-foreground" /> : null}
                      onClick={() => {
                        setEfforts((cur) => ({ ...cur, [model.id]: lv }));
                        closeMenu();
                      }}
                    />
                  ))}
                </>
              )}

              {view === "more" && (
                <>
                  <MenuRow label="More models" lead={<ChevronLeft size={16} />} onClick={() => setView("main")} />
                  <label className="mx-1 my-1 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-muted-foreground focus-within:bg-muted @md:py-2">
                    <Search size={15} aria-hidden />
                    <span className="sr-only">Search models</span>
                    <input
                      data-item
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search models"
                      className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60 @md:text-sm"
                    />
                  </label>
                  <div className={cn("max-h-44 overflow-y-auto", NO_SCROLLBAR)}>
                    {moreModels.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matching models.</p>}
                    {moreModels.map((m) => {
                      const on = !auto && m.id === model.id;
                      return (
                        <MenuRow
                          key={m.id}
                          role="menuitemradio"
                          checked={on}
                          label={m.name}
                          badge={m.hint}
                          trailing={on ? <Check size={15} className="text-foreground" /> : null}
                          onClick={() => chooseModel(m.id)}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </Popover>
          )}
        </AnimatePresence>

        <button
          ref={modeBtn}
          type="button"
          aria-haspopup="menu"
          aria-expanded={menu === "mode"}
          aria-label={`Mode: ${mode}`}
          title="Change with /plan, /ask or /build"
          onClick={() => openMenu("mode")}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card/90 px-3.5 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-card focus-visible:outline-2 focus-visible:outline-ring @md:h-9"
        >
          {mode}
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        <button
          ref={modelBtn}
          type="button"
          aria-haspopup="true"
          aria-expanded={menu === "model"}
          onClick={() => openMenu("model")}
          className="inline-flex h-11 min-w-0 items-center gap-1.5 rounded-full border border-border bg-card/90 px-3.5 text-sm text-muted-foreground shadow-sm backdrop-blur hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring @md:h-9"
        >
          {!auto && <ModelDot id={model.id} small />}
          <span className="truncate font-medium text-foreground">{auto ? "Auto" : model.name}</span>
          {!auto && <span className="hidden @sm:inline">{effort}</span>}
          <ChevronDown size={14} className="shrink-0" />
        </button>
      </div>

        </>
      )}

      {over && (
        <p className="mt-1 px-3 text-xs text-rose-600 dark:text-rose-400">
          That is {(text.length - maxLength).toLocaleString()} characters over the limit. Shorten it to send.
        </p>
      )}
    </div>
  );
}

/** Hover and keyboard-focus label for icon-only buttons. It is fixed-position, so no scrolling or clipping parent can cut it off. */
function useTip(el: HTMLElement | null, label: string) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const show = (viaFocus: boolean) => {
    if (!el) return;
    // Mouse tooltips only with a real pointer; keyboard tooltips only when focus is visible.
    if (viaFocus ? !el.matches(":focus-visible") : !window.matchMedia("(pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 72), window.innerWidth - 72), y: r.top });
  };
  const hide = () => setPos(null);
  return {
    bind: { onMouseEnter: () => show(false), onMouseLeave: hide, onFocus: () => show(true), onBlur: hide },
    tip: pos ? (
      <span
        aria-hidden
        className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md"
        style={{ left: pos.x, top: pos.y - 6 }}
      >
        {label}
      </span>
    ) : null,
  };
}

/** A button that shows a label on hover and keyboard focus. */
function TipButton({ tip, children, ...rest }: { tip: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const [tEl, setTEl] = useState<HTMLButtonElement | null>(null);
  const t = useTip(tEl, tip);
  return (
    <button ref={setTEl} {...t.bind} {...rest}>
      {children}
      {t.tip}
    </button>
  );
}

/** A small coloured dot standing in for a model's logo, stable per id. */
function ModelDot({ id, small }: { id: string; small?: boolean }) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className={cn("shrink-0 rounded-full", small ? "size-4" : "size-5")}
      style={{ background: `linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 50) % 360} 70% 45%))` }}
    />
  );
}

/** Floating panel that grows out of its trigger and leaves along the same path, only faster. */
function Popover({
  children,
  label,
  origin,
  className,
  role,
  popRef,
}: {
  children: ReactNode;
  label: string;
  origin: string;
  className?: string;
  role: "menu" | "listbox" | "group";
  popRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.div
      ref={popRef}
      role={role}
      aria-label={label}
      style={{ transformOrigin: origin }}
      initial={{ opacity: 0, scale: 0.95, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.97, y: 4, filter: "blur(3px)", transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", bounce: 0, duration: 0.28 }}
      className={cn("absolute bottom-full z-30 mb-2 rounded-2xl border border-border bg-card/90 p-1.5 shadow-xl backdrop-blur-xl backdrop-saturate-150", className)}
    >
      {children}
    </motion.div>
  );
}

/** One row of a menu: label, optional small badge, and something on the right (a check, number or arrow). */
function MenuRow({
  label,
  badge,
  lead,
  trailing,
  onClick,
  disabled,
  checked,
  autoFocus,
  role = "menuitem",
}: {
  label: string;
  badge?: string;
  lead?: ReactNode;
  trailing?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  checked?: boolean;
  autoFocus?: boolean;
  role?: "menuitem" | "menuitemradio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "menuitemradio" ? !!checked : undefined}
      data-item
      data-autofocus={autoFocus || undefined}
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-40 @md:py-2 @md:text-sm"
    >
      <span className="flex min-w-0 items-center gap-2">
        {lead}
        <span className="truncate">{label}</span>
        {badge && <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">{badge}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-muted-foreground">{trailing}</span>
    </button>
  );
}
