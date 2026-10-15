// Bản sắc của một tông môn (task 9.0.4): truyền thống, tuyệt kỹ, giai thoại, đối thủ, nhân vật nổi bật.
import type { Content } from '../../core/content';
import type { Sect } from '../../core/schemas';
import { Fold } from './Fold';
import { TermText } from './Tooltip';

export function SectIdentity({ sect, content }: { sect: Sect; content: Content }) {
  const id = sect.identity;
  if (!id) return null;
  const rival = id.rival && content.sects.find((s) => s.id === id.rival!.sect);
  return (
    <Fold id={`identity:${sect.id}`} title="Bản sắc">
      <p class="profile-note"><b>Truyền thống.</b> <TermText text={id.tradition} /></p>
      <p class="profile-note"><b>Tuyệt kỹ.</b> <TermText text={id.signature} /></p>
      <p class="profile-note"><b>Giai thoại.</b> <TermText text={id.anecdote} /></p>
      {rival && id.rival && <p class="profile-note"><b>Đối thủ.</b> {rival.name}: {id.rival.reason}</p>}
      {id.notable.map((n) => (
        <p class="profile-note" key={n.name}><b>{n.title} {n.name}.</b> {n.text}</p>
      ))}
    </Fold>
  );
}
