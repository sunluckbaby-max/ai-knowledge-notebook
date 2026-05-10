import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpenText,
  Camera,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { createWorker } from "tesseract.js";
import "./styles.css";

const CATEGORIES = ["全部", "计算机", "AI", "科研", "工具", "其他"];
const EDIT_CATEGORIES = CATEGORIES.filter((category) => category !== "全部");
const STORAGE_KEY = "ai-knowledge-notebook.notes.v1";

const nowIso = () => new Date().toISOString();

const formatTime = (iso) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));

const splitTags = (value) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const createEmptyNote = (body = "") => {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    title: "",
    body,
    category: "计算机",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

const sampleNotes = [
  {
    id: "sample-pwa",
    title: "PWA 部署检查清单",
    body: "manifest、service worker、移动端图标、Vercel 构建命令都需要在发布前检查。iPhone 添加到主屏幕后要确认启动画面和状态栏颜色。",
    category: "工具",
    tags: ["PWA", "Vercel", "部署"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "sample-ocr",
    title: "OCR 截图笔记流程",
    body: "上传 AI、GitHub 或网页教程截图后，用 Tesseract.js 识别文字，再编辑成自己的知识卡片。",
    category: "AI",
    tags: ["OCR", "Tesseract", "Codex"],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleNotes;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : sampleNotes;
  } catch {
    return sampleNotes;
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [activeNote, setActiveNote] = useState(null);
  const [ocrOpen, setOcrOpen] = useState(false);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [notes]
  );
  const [tagFilter, setTagFilter] = useState("全部");

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes
      .filter((note) => category === "全部" || note.category === category)
      .filter((note) => tagFilter === "全部" || note.tags.includes(tagFilter))
      .filter((note) => {
        if (!normalizedQuery) return true;
        return [note.title, note.body, note.category, note.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [notes, query, category, tagFilter]);

  const upsertNote = (note) => {
    setNotes((current) => {
      const exists = current.some((item) => item.id === note.id);
      const nextNote = { ...note, updatedAt: nowIso(), title: note.title.trim() || "未命名笔记" };
      return exists ? current.map((item) => (item.id === note.id ? nextNote : item)) : [nextNote, ...current];
    });
    setActiveNote(null);
  };

  const deleteNote = (id) => {
    setNotes((current) => current.filter((note) => note.id !== id));
    setActiveNote(null);
  };

  const createFromOcr = (text) => {
    setOcrOpen(false);
    setActiveNote(createEmptyNote(text));
  };

  if (activeNote) {
    return <Editor note={activeNote} onBack={() => setActiveNote(null)} onSave={upsertNote} onDelete={deleteNote} />;
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-4 py-5 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[430px] flex-col gap-5">
        <header className="glass-panel overflow-hidden p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-300">
                <Sparkles size={14} />
                本地优先 PWA
              </div>
              <h1 className="text-[2rem] font-semibold leading-tight tracking-normal">AI 知识笔记本</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">记录计算机、AI 与科研知识</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200 shadow-card">
              <BookOpenText size={25} />
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <label className="search-shell">
            <Search className="text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、正文、分类或标签"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            {query ? (
              <button type="button" className="icon-button small" onClick={() => setQuery("")} aria-label="清除搜索">
                <X size={15} />
              </button>
            ) : null}
          </label>

          <div className="scroll-row">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`pill ${category === item ? "pill-active" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>

          {allTags.length ? (
            <div className="scroll-row">
              {["全部", ...allTags].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tag)}
                  className={`tag-filter ${tagFilter === tag ? "tag-filter-active" : ""}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <button type="button" className="primary-action" onClick={() => setOcrOpen(true)}>
            <Camera size={19} />
            OCR 上传
          </button>
          <button type="button" className="secondary-action" onClick={() => setActiveNote(createEmptyNote())}>
            <Plus size={19} />
            新建笔记
          </button>
        </section>

        <section className="flex flex-1 flex-col gap-3 pb-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-slate-300">笔记列表</p>
            <span className="text-xs text-slate-500">{filteredNotes.length} 条</span>
          </div>

          {filteredNotes.length ? (
            filteredNotes.map((note) => <NoteCard key={note.id} note={note} onOpen={() => setActiveNote(note)} />)
          ) : (
            <div className="empty-state">
              <FileText size={34} />
              <p>没有匹配的笔记</p>
            </div>
          )}
        </section>
      </div>

      {ocrOpen ? <OcrModal onClose={() => setOcrOpen(false)} onConfirm={createFromOcr} /> : null}
    </main>
  );
}

function NoteCard({ note, onOpen }) {
  const summary = note.body.replace(/\s+/g, " ").trim() || "暂无正文";

  return (
    <button type="button" onClick={onOpen} className="note-card text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-semibold text-white">{note.title || "未命名笔记"}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{summary}</p>
        </div>
        <span className="category-chip">{note.category}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {note.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="note-tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Clock3 size={13} />
        更新于 {formatTime(note.updatedAt)}
      </div>
    </button>
  );
}

function Editor({ note, onBack, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...note, tagInput: note.tags.join(", ") });

  const updateDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const handleSave = () => {
    onSave({
      ...draft,
      tags: splitTags(draft.tagInput)
    });
  };

  return (
    <main className="min-h-screen bg-[#08090d] px-4 py-5 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[430px] flex-col gap-4">
        <header className="flex items-center justify-between">
          <button type="button" className="ghost-button" onClick={onBack}>
            <ChevronLeft size={18} />
            返回
          </button>
          <span className="text-xs text-slate-500">创建于 {formatTime(draft.createdAt)}</span>
        </header>

        <section className="editor-panel">
          <input
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            placeholder="标题"
            className="title-input"
          />

          <div className="grid grid-cols-1 gap-3">
            <label className="field-label">
              分类
              <select
                value={draft.category}
                onChange={(event) => updateDraft({ category: event.target.value })}
                className="field-control"
              >
                {EDIT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              标签
              <input
                value={draft.tagInput}
                onChange={(event) => updateDraft({ tagInput: event.target.value })}
                placeholder="GitHub, Vercel, Python"
                className="field-control"
              />
            </label>
          </div>

          <textarea
            value={draft.body}
            onChange={(event) => updateDraft({ body: event.target.value })}
            placeholder="写下 Markdown 风格笔记、命令、科研流程或截图 OCR 内容..."
            className="body-input"
          />
        </section>

        <footer className="grid grid-cols-[1fr_auto] gap-3 pb-3">
          <button type="button" className="save-button" onClick={handleSave}>
            <Check size={19} />
            保存笔记
          </button>
          <button type="button" className="delete-button" onClick={() => onDelete(draft.id)} aria-label="删除笔记">
            <Trash2 size={19} />
          </button>
        </footer>
      </div>
    </main>
  );
}

function OcrModal({ onClose, onConfirm }) {
  const [status, setStatus] = useState("等待上传图片");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const recognize = async (file) => {
    if (!file) return;
    setBusy(true);
    setText("");
    setProgress(0);
    setStatus("正在初始化 OCR");

    const worker = await createWorker("chi_sim+eng", 1, {
      logger: (message) => {
        if (message.status) setStatus(message.status);
        if (typeof message.progress === "number") setProgress(Math.round(message.progress * 100));
      }
    });

    try {
      const result = await worker.recognize(file);
      setText(result.data.text.trim());
      setStatus("识别完成");
      setProgress(100);
    } catch {
      setStatus("识别失败，请换一张更清晰的图片");
    } finally {
      await worker.terminate();
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 pb-4 backdrop-blur-md sm:items-center sm:pb-0">
      <section className="modal-panel w-full max-w-[430px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">OCR 截图转笔记</h2>
            <p className="mt-1 text-sm text-slate-400">上传截图后，识别结果会自动进入正文。</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭 OCR">
            <X size={18} />
          </button>
        </div>

        <label className="upload-box">
          <Camera size={26} />
          <span>选择截图或图片</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(event) => recognize(event.target.files?.[0])}
          />
        </label>

        <div className="progress-shell">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="OCR 结果会显示在这里，可先编辑再确认。"
          className="ocr-result"
        />

        <button type="button" className="save-button w-full" disabled={!text.trim()} onClick={() => onConfirm(text)}>
          <Check size={19} />
          用识别结果创建笔记
        </button>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
