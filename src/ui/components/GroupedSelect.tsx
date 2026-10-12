// A <select> whose options sit under group headings (optgroup), so long lists stay easy to scan.
// Options without a group go first, ungrouped.
export interface SelectOption { id: string; name: string; group?: string; hint?: string }

export function GroupedSelect({ value, onChange, label, options, placeholder }: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  options: SelectOption[];
  /** Shown as a disabled first entry when nothing is picked. */
  placeholder?: string;
}) {
  const groups: { name: string; items: SelectOption[] }[] = [];
  for (const o of options.filter((x) => x.group)) {
    const g = groups.find((x) => x.name === o.group);
    if (g) g.items.push(o);
    else groups.push({ name: o.group!, items: [o] });
  }
  const text = (o: SelectOption) => (o.hint ? `${o.name} · ${o.hint}` : o.name);
  return (
    <select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)} aria-label={label}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.filter((o) => !o.group).map((o) => <option key={o.id} value={o.id}>{text(o)}</option>)}
      {groups.map((g) => (
        <optgroup key={g.name} label={g.name}>
          {g.items.map((o) => <option key={o.id} value={o.id}>{text(o)}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
