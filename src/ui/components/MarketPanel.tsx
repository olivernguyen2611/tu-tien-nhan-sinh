// "Phường thị" (task 3.2): pick a market, buy, sell, bargain once a year.
// Playtest 2: markets of the current region, technique scrolls, auction houses.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { itemById } from '../../systems/items';
import { currentRegion } from '../../systems/regions';
import { CURRENCY_LABEL, auctionBlocked, auctionLots, bargainChance, canBargain, marketOffers, openMarkets, sellPrice, techniqueOffers } from '../../systems/market';

export type MarketAction = { kind: 'buy' | 'sell'; itemId: string } | { kind: 'bargain' } | { kind: 'scroll'; techId: string } | { kind: 'bid'; lot: string; bid: number };

export function MarketPanel({ state, content, onAction, onClose }: {
  state: GameState;
  content: Content;
  onAction: (marketId: string, action: MarketAction) => { text: string; tone: Tone };
  onClose: () => void;
}) {
  const markets = openMarkets(state, content);
  const [marketId, setMarketId] = useState(markets[0]?.id ?? '');
  const [result, setResult] = useState<{ text: string; tone: Tone } | null>(null);
  const m = markets.find((x) => x.id === marketId);
  const act = (a: MarketAction) => m && setResult(onAction(m.id, a));
  const sellable = m
    ? Object.entries(state.inventory).filter(([id, n]) => n > 0 && sellPrice(content, m.id, id) !== null)
    : [];

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Phường thị" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Khám phá{currentRegion(state, content) ? ` · ${currentRegion(state, content)!.name}` : ''}</div>
        <h2>Phường thị</h2>
        {markets.length === 0 ? (
          <p class="story">{state.character.age < content.balance.market.minAge
            ? 'Còn nhỏ quá, cha mẹ chưa cho đi chợ một mình.'
            : 'Quanh đây chẳng có chợ nào mở cửa cho ngươi.'}</p>
        ) : (
          <>
            <div class="action-chips" role="tablist">
              {markets.map((x) => (
                <button key={x.id} role="tab" aria-selected={x.id === marketId} class={`chip-btn${x.id === marketId ? ' active' : ''}`}
                  onClick={() => { setMarketId(x.id); setResult(null); }}>{x.name}</button>
              ))}
            </div>
            {m && (
              <>
                <p class="story">{m.description}</p>
                <p class="profile-note">Đang có {state.money[m.currency]} {CURRENCY_LABEL[m.currency]}.</p>
                {!m.auction && (
                  <button class="chip-btn" disabled={!canBargain(state, m.id)} onClick={() => act({ kind: 'bargain' })}>
                    {canBargain(state, m.id) ? `Trả giá (${Math.round(bargainChance(state, content) * 100)}% thành công)` : 'Năm nay đã trả giá'}
                  </button>
                )}

                {m.auction && (() => {
                  const blocked = auctionBlocked(state, content, m.id);
                  return (
                    <>
                      <h3 class="market-head">Phiên đấu giá năm nay</h3>
                      <p class="profile-note">Mỗi năm chỉ ra giá một lần. Giá càng cao càng dễ thắng; thua thì không mất gì.</p>
                      {blocked && <p class="profile-note">{blocked}</p>}
                      <ul class="bag-list">
                        {auctionLots(state, content, m.id).map((lot) => (
                          <li class="bag-item auction-lot" key={lot.key}>
                            <div>
                              <b>{lot.name}</b>
                              <span class="profile-note">{lot.note}</span>
                              <span class="profile-note">Giá khởi điểm {lot.start} LT</span>
                            </div>
                            <div class="action-chips">
                              {lot.bids.map((b, i) => (
                                <button class="chip-btn" key={i} disabled={!!blocked || state.money[m.currency] < b.price}
                                  onClick={() => act({ kind: 'bid', lot: lot.key, bid: i })}>
                                  {b.price} LT · {Math.round(b.chance * 100)}%
                                </button>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  );
                })()}

                {techniqueOffers(state, content, m.id).length > 0 && (
                  <>
                    <h3 class="market-head">Bí tịch công pháp</h3>
                    <ul class="bag-list">
                      {techniqueOffers(state, content, m.id).map((t) => (
                        <li class="bag-item market-row" key={t.id}>
                          <div>
                            <b>{t.name}</b>
                            <span class="profile-note">{t.grade} phẩm{t.blocked ? ` · ${t.blocked}` : ''}</span>
                          </div>
                          <button class="chip-btn" disabled={!!t.blocked} onClick={() => act({ kind: 'scroll', techId: t.id })}>
                            {t.price} {m.currency === 'silver' ? 'bạc' : 'LT'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {!(m.auction && marketOffers(state, content, m.id).length === 0) && <h3 class="market-head">Mua</h3>}
                {!m.auction && marketOffers(state, content, m.id).length === 0 && <p class="profile-note">Hôm nay chưa bày hàng gì.</p>}
                <ul class="bag-list">
                  {marketOffers(state, content, m.id).map(({ item, price }) => (
                    <li class="bag-item market-row" key={item.id}>
                      <div>
                        <b>{item.name}</b>
                        {item.summary && <span class="profile-note">{item.summary}</span>}
                      </div>
                      <button class="chip-btn" disabled={state.money[m.currency] < price} onClick={() => act({ kind: 'buy', itemId: item.id })}>
                        {price} {m.currency === 'silver' ? 'bạc' : 'LT'}
                      </button>
                    </li>
                  ))}
                </ul>

                {sellable.length > 0 && (
                  <>
                    <h3 class="market-head">Bán</h3>
                    <ul class="bag-list">
                      {sellable.map(([id, n]) => (
                        <li class="bag-item market-row" key={id}>
                          <div><b>{itemById(content, id)?.name}</b> <span class="profile-note">×{n}</span></div>
                          <button class="chip-btn" onClick={() => act({ kind: 'sell', itemId: id })}>
                            +{sellPrice(content, m.id, id)} {m.currency === 'silver' ? 'bạc' : 'LT'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )}
        {result && result.text && <p class={`action-result ${result.tone}`} role="status">{result.text}</p>}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
