// Mục thu gọn (task 9.0.5): đầu mục kèm số lượng, bấm mới xổ danh sách. Nhớ mục nào đã mở trong phiên chơi.
import type { ComponentChildren } from 'preact';

const opened = new Set<string>();

export function Fold({ id, title, count, hint, children }: {
  /** Stable key used to remember that the section was opened. */
  id: string;
  title: ComponentChildren;
  /** Shown beside the title, e.g. the length of the list inside. */
  count?: number;
  /** A short dot/label for something waiting to be done. */
  hint?: string;
  children: ComponentChildren;
}) {
  return (
    <details class="fold" open={opened.has(id)} onToggle={(e) => {
      if ((e.currentTarget as HTMLDetailsElement).open) opened.add(id);
      else opened.delete(id);
    }}>
      <summary class="fold-head">
        <span class="fold-title">{title}</span>
        {count !== undefined && <span class="fold-count">{count}</span>}
        {hint && <span class="fold-hint">{hint}</span>}
      </summary>
      <div class="fold-body">{children}</div>
    </details>
  );
}
