// Browser glue for the save system: a storage that never throws on access,
// and file download/upload helpers.
import type { KeyValueStore } from '../systems/save';

const memory = new Map<string, string>();
const memoryStore: KeyValueStore = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
};

/** localStorage, or an in-memory stand-in when the browser blocks it (saves then last only this visit). */
export function browserStore(): KeyValueStore {
  try {
    const ls = window.localStorage;
    ls.getItem('tutien.probe');
    return ls;
  } catch {
    return memoryStore;
  }
}

export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read a picked file as JSON; null when it is not valid JSON. */
export async function readJsonFile(file: File): Promise<unknown | null> {
  try {
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}
