"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  defaultValue: string;
  rows?: number;
  placeholder?: string;
};

export default function TripDescriptionEditor({ name, defaultValue, rows = 8, placeholder = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue || "");

  useEffect(() => {
    setHtml(defaultValue || "");
  }, [defaultValue]);

  const keepSelection = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };
  const run = (cmd: string, value?: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, value);
    setHtml(el.innerHTML);
  };
  const insertHtml = (value: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand("insertHTML", false, value);
    setHtml(el.innerHTML);
  };

  return (
    <div>
      <div className="mb-2 d-flex gap-2 flex-wrap">
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Bold" onMouseDown={keepSelection} onClick={() => run("bold")}>
          <i className="fa-solid fa-bold" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Italic" onMouseDown={keepSelection} onClick={() => run("italic")}>
          <i className="fa-solid fa-italic" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Underline" onMouseDown={keepSelection} onClick={() => run("underline")}>
          <i className="fa-solid fa-underline" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Heading" onMouseDown={keepSelection} onClick={() => run("formatBlock", "<h3>")}>
          <i className="fa-solid fa-heading" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="List" onMouseDown={keepSelection} onClick={() => run("insertUnorderedList")}>
          <i className="fa-solid fa-list-ul" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Quote" onMouseDown={keepSelection} onClick={() => run("formatBlock", "<blockquote>")}>
          <i className="fa-solid fa-quote-left" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-light p-1"
          style={{ width: 30, height: 30 }}
          title="Link"
          onMouseDown={keepSelection}
          onClick={() => {
            const href = window.prompt("Холбоос оруулна уу", "https://");
            if (!href) return;
            run("createLink", href);
          }}
        >
          <i className="fa-solid fa-link" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Align center" onMouseDown={keepSelection} onClick={() => run("justifyCenter")}>
          <i className="fa-solid fa-align-center" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Justify" onMouseDown={keepSelection} onClick={() => run("justifyFull")}>
          <i className="fa-solid fa-align-justify" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Line break" onMouseDown={keepSelection} onClick={() => insertHtml("<br/>")}>
          <i className="fa-solid fa-arrow-turn-down" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger p-1"
          style={{ width: 30, height: 30 }}
          title="Clear tags"
          onMouseDown={keepSelection}
          onClick={() => {
            const el = ref.current;
            if (!el) return;
            el.innerText = el.innerText;
            setHtml(el.innerHTML);
            el.focus();
          }}
        >
          <i className="fa-solid fa-eraser" />
        </button>
      </div>
      <input type="hidden" name={name} value={html} />
      <div
        ref={ref}
        className="pm-input"
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight: `${rows * 1.5}rem`, whiteSpace: "pre-wrap" }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: html }}
        onInput={(e) => setHtml((e.currentTarget as HTMLDivElement).innerHTML)}
      />
      <p className="small text-muted mt-2 mb-0">Plugin toolbar: heading, list, link, center, justify, quote, break, clear formatting.</p>
    </div>
  );
}
