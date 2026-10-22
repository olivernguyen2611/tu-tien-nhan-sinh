// 10.4 Gia sản: owned assets, buying by kind, the crop for the year, a shop's way of trading, loans.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState } from '../../core/types';
import { ASSET_KINDS, type AssetAction, assetViews, assetsOf, debtTotal, forecast, ownedOf, ownedViews } from '../../systems/assets';
import { Fold } from './Fold';

export function AssetSection({ state, content, onAsset }: {
  state: GameState;
  content: Content;
  onAsset: (a: AssetAction) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const file = content.assets;
  if (!file || !state.alive) return null;
  const act = (a: AssetAction) => setResult(onAsset(a) ?? 'Không làm được.');
  const owned = ownedViews(state, content);
  const views = assetViews(state, content);
  const a = assetsOf(state);
  const hasLand = ownedOf(state, content, 'land').length > 0;
  const shop = ownedOf(state, content, 'shop')[0];
  const owed = debtTotal(state);
  const news = hasLand ? forecast(state, content)?.news : null;

  return (
    <Fold id="market:Gia sản" title="Gia sản" count={owned.length || undefined}>
      {owned.length === 0 ? <p class="profile-note">Chưa có gì trong tay. Nhà, ruộng, cửa hiệu… đều mua ở đây.</p> : (
        owned.map((o) => (
          <div class="career-row" key={o.uid}>
            <div class="craft-head"><b>{o.name}</b><span>bán được {o.value} lượng</span></div>
            <button class="chip-btn" onClick={() => act({ kind: 'sell', id: o.id, uid: o.uid })}>Bán</button>
          </div>
        ))
      )}
      {hasLand && (
        <div class="career-row">
          <p class="story">{news}</p>
          <div class="chip-row">
            {file.crops.map((c) => (
              <button key={c.id} class="chip-btn" aria-pressed={a.crop === c.id} onClick={() => act({ kind: 'crop', id: c.id })}>{c.name}</button>
            ))}
          </div>
        </div>
      )}
      {shop && (
        <div class="career-row">
          <div class="craft-head">Cách làm ăn của cửa hiệu</div>
          <div class="chip-row">
            {file.strategies.map((st) => (
              <button key={st.id} class="chip-btn" aria-pressed={shop.strategy === st.id} onClick={() => act({ kind: 'strategy', id: st.id })}>{st.name}</button>
            ))}
          </div>
        </div>
      )}
      <div class="career-row">
        <div class="craft-head">Vay mượn{owed > 0 ? ` · đang nợ ${owed} lượng` : ''}</div>
        <div class="chip-row">
          {file.loans.map((l) => (
            <button key={l.id} class="chip-btn" onClick={() => act({ kind: 'borrow', id: l.id })}>{l.name} ({l.amount} lượng, lãi {Math.round(l.rate * 100)}%)</button>
          ))}
          {owed > 0 && <button class="chip-btn" disabled={state.money.silver < owed} onClick={() => act({ kind: 'repay' })}>Trả hết nợ</button>}
        </div>
      </div>
      <button class="chip-btn asset-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Thôi' : 'Tậu thêm'}</button>
      {open && ASSET_KINDS.map((k) => {
        const rows = views.filter((v) => v.kind === k.id);
        if (rows.length === 0) return null;
        return (
          <div key={k.id}>
            <h3 class="panel-sub">{k.name}</h3>
            {rows.map((v) => (
              <div class="career-row" key={v.id}>
                <div class="craft-head"><b>{v.name}</b><span>{v.price} lượng{v.income ? ` · thu ~${v.income}/năm` : ''}{v.owned ? ` · đang có ${v.owned}` : ''}</span></div>
                <p class="profile-note">{v.description}</p>
                <button class="chip-btn" disabled={!!v.blocked} onClick={() => act({ kind: 'buy', id: v.id })}>Mua</button>
                {v.blocked && <span class="craft-note">{v.blocked}</span>}
              </div>
            ))}
          </div>
        );
      })}
      {result && <p class="action-result">{result}</p>}
    </Fold>
  );
}
