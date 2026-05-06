"use client";

import { type MouseEvent, useRef } from "react";

type Props = {
  name: string;
  defaultValue: string;
  rows?: number;
  placeholder?: string;
};

function wrapSelection(el: HTMLTextAreaElement, before: string, after: string, fallback = ""): void {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const selected = el.value.slice(start, end);
  const body = selected || fallback;
  if (!body) {
    el.focus();
    return;
  }
  const next = `${el.value.slice(0, start)}${before}${body}${after}${el.value.slice(end)}`;
  el.value = next;
  const cursor = start + before.length + body.length + after.length;
  el.selectionStart = cursor;
  el.selectionEnd = cursor;
  el.focus();
}

function insertAtCursor(el: HTMLTextAreaElement, text: string): void {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const next = `${el.value.slice(0, start)}${text}${el.value.slice(end)}`;
  el.value = next;
  const cursor = start + text.length;
  el.selectionStart = cursor;
  el.selectionEnd = cursor;
  el.focus();
}

export default function TripDescriptionEditor({ name, defaultValue, rows = 8, placeholder = "" }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const keepSelection = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <div className="mb-2 d-flex gap-2 flex-wrap">
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Bold" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, "<strong>", "</strong>")}>
          <i className="fa-solid fa-bold" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Italic" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, "<em>", "</em>")}>
          <i className="fa-solid fa-italic" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Underline" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, "<u>", "</u>")}>
          <i className="fa-solid fa-underline" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Heading" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, "<h3>", "</h3>")}>
          <i className="fa-solid fa-heading" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="List" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, "<ul>\n  <li>", "</li>\n</ul>")}>
          <i className="fa-solid fa-list-ul" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Quote" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, "<blockquote>", "</blockquote>")}>
          <i className="fa-solid fa-quote-left" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Link" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, '<a href="https://">', "</a>")}>
          <i className="fa-solid fa-link" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Align center" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, '<div style="text-align:center;">', "</div>")}>
          <i className="fa-solid fa-align-center" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Justify" onMouseDown={keepSelection} onClick={() => ref.current && wrapSelection(ref.current, '<div style="text-align:justify;">', "</div>")}>
          <i className="fa-solid fa-align-justify" />
        </button>
        <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 30, height: 30 }} title="Line break" onMouseDown={keepSelection} onClick={() => ref.current && insertAtCursor(ref.current, "<br/>\n")}>
          <i className="fa-solid fa-arrow-turn-down" />
        </button>
        <button type="button" className="btn btn-sm btn-outline-danger p-1" style={{ width: 30, height: 30 }} title="Clear tags" onMouseDown={keepSelection} onClick={() => {
          const el = ref.current;
          if (!el) return;
          el.value = el.value.replace(/<[^>]*>/g, "");
          el.focus();
        }}>
          <i className="fa-solid fa-eraser" />
        </button>
      </div>
      <textarea
        ref={ref}
        className="pm-input"
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
      <p className="small text-muted mt-2 mb-0">Plugin toolbar: heading, list, link, center, justify, quote, break, clear formatting.</p>
    </div>
  );
}
