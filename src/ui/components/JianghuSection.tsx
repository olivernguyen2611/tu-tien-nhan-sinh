// 9.W: thế lực giang hồ (thế gia, môn phái, giáo phái, bang hội), shown apart from the cultivation sects.
// Read-only for now; joining comes with 11.2.
import type { Content } from '../../core/content';
import { Fold } from './Fold';

const KIND: Record<string, string> = {
  mon_phai: 'Môn phái', the_gia: 'Thế gia', giao_phai: 'Giáo phái', bang_hoi: 'Bang hội',
  sat_thu: 'Sát thủ lâu', tieu_cuc: 'Tiêu cục', thuong_hoi: 'Thương hội',
};
const STANCE: Record<string, string> = { chinh: 'Chính phái', ta: 'Tà phái', trung_lap: 'Trung lập', ma: 'Ma giáo' };

export function JianghuSection({ content }: { content: Content }) {
  const factions = content.jianghuFactions ?? [];
  if (factions.length === 0) return null;
  const nameOf = (id: string) => factions.find((f) => f.id === id)?.name ?? id;
  const regionOf = (id: string) => content.regions.find((r) => r.id === id)?.name ?? id;
  return (
    <Fold id="sect:jianghu" title="Thế lực giang hồ" count={factions.length}>
      <p class="profile-note">Võ lâm của phàm nhân, khác với tông môn tu tiên. Chưa gia nhập được.</p>
      {Object.keys(STANCE).map((stance) => {
        const list = factions.filter((f) => f.alignment === stance);
        if (list.length === 0) return null;
        return (
          <div key={stance}>
            <h3 class="muted">{STANCE[stance]}</h3>
            {list.map((f) => (
              <div class="career-row" key={f.id}>
                <div class="craft-head"><b>{f.name}</b><span class="muted">{KIND[f.kind]} · {regionOf(f.region)}</span></div>
                <p class="profile-note"><i>{f.motto}</i> {f.description}</p>
                <p class="profile-note">Tuyệt học: {f.signature}</p>
                <p class="profile-note">Gia nhập: {f.entry}</p>
                {(f.allies.length > 0 || f.rivals.length > 0) && (
                  <p class="profile-note">
                    {f.allies.length > 0 && <>Giao hảo: {f.allies.map(nameOf).join(', ')}. </>}
                    {f.rivals.length > 0 && <>Đối địch: {f.rivals.map(nameOf).join(', ')}.</>}
                  </p>
                )}
                {f.notable.map((n) => <p class="profile-note" key={n.name}>{n.title} {n.name}: {n.text}</p>)}
              </div>
            ))}
          </div>
        );
      })}
    </Fold>
  );
}
