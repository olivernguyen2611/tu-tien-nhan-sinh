// "Tu luyện" sheet: realm, root, yearly progress, and the big breakthrough button.
import { useState } from 'preact/hooks';
import type { Content } from '../../core/content';
import type { GameState, Tone } from '../../core/types';
import { inBottleneck, majorBreakthroughInfo, realmLabel, rootLabel, yearlyGain } from '../../systems/cultivation';
import { Meter } from './Meter';
import { TermText } from './Tooltip';

export function CultivatePanel({ state, content, onBreakthrough, onClose }: {
  state: GameState;
  content: Content;
  /** Returns the outcome to show in the sheet. */
  onBreakthrough: () => { text: string; tone: Tone; changes: string } | null;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ text: string; tone: Tone; changes: string } | null>(null);
  const { cult } = state;
  const mortal = cult.realm === 'pham_nhan';
  const gain = yearlyGain(state, content);
  const info = majorBreakthroughInfo(state, content);
  const foundation = content.cultivation.realms.foundations.find((g) => g.id === cult.foundation);

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tu luyện" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="event-card">
        <div class="kicker">Tu luyện</div>
        <h2>{realmLabel(state, content)}</h2>
        <p class="profile-root"><TermText text={`Linh căn: ${rootLabel(state, content)}`} /></p>
        {foundation && <p class="profile-note"><TermText text={`Đạo cơ ${foundation.name}: ${foundation.description}`} /></p>}
        {mortal ? (
          <p class="story">
            <TermText text={cult.root ? 'Không có linh căn, linh khí không đọng lại trong người. Đường tu tiên tạm thời khép cửa.' : 'Chưa thử linh căn. Có khi một ngày tiên sư sẽ ghé qua quê nhà.'} />
          </p>
        ) : (
          <>
            <div class="stat-row wide"><span class="icon">修</span><Meter label="Tu vi" term="tu_vi" value={cult.progress} color="var(--bar-cult)" text={`${Math.floor(cult.progress)}%`} /></div>
            <p class="profile-note">Mỗi năm tăng khoảng {gain.toFixed(1)}% thanh tu vi.{inBottleneck(state, content) ? ' Đang gặp bình cảnh.' : ''}</p>
          </>
        )}

        {info && state.alive && (
          <div class="breakthrough">
            <p class="story"><TermText text={`Đột phá ${info.target.name}: tỉ lệ thành công khoảng ${Math.round(info.chancePct)}%.`} /></p>
            {info.blocked ? (
              <p class="profile-note">{info.blocked}</p>
            ) : confirming ? (
              <>
                <p class="profile-note">Thất bại có thể mất tu vi, tổn thương kinh mạch, giảm thọ, tẩu hỏa nhập ma, hiếm khi mất mạng.</p>
                <button class="choice" onClick={() => { setConfirming(false); setResult(onBreakthrough()); }}>Quyết, đột phá!</button>
                <button class="choice" onClick={() => setConfirming(false)}>Thôi, tích thêm đã</button>
              </>
            ) : (
              <button class="btn-primary" onClick={() => setConfirming(true)}>Đột phá {info.target.name}</button>
            )}
          </div>
        )}

        {result && (
          <p class={`action-result ${result.tone}`}>
            <TermText text={result.text} />
            {result.changes && <span class="changes">{result.changes}</span>}
          </p>
        )}
        <button class="choice" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
