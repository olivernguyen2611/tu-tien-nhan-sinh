import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife } from '../src/core/state';
import type { GameState } from '../src/core/types';
import { activityViews, doActivity } from '../src/systems/activities';
import { dockGroups } from '../src/systems/dock';

const content = loadContent();

function cultivator(seed: string, realm = 'truc_co'): GameState {
  const b = createLife({ seed }, content);
  return {
    ...b,
    character: { ...b.character, age: 40 },
    tier: 'tu_chan', tierHistory: { pham_gian: 0, tu_chan: 15 },
    events: { pending: null, history: {}, followUps: [], npc: null },
    cult: { ...b.cult, realm, stage: 1, lifespan: 220 },
  };
}

describe('13.5 Hoạt động tu sĩ', () => {
  it('a cultivator has the Tu hành group; a mortal does not', () => {
    const tu = activityViews(cultivator('th1'), content).filter((a) => a.group === 'tu_hanh').map((a) => a.id);
    expect(tu).toEqual(expect.arrayContaining(['san_yeu_thu', 'kham_pha_di_tich', 'du_luan_dao_hoi', 'hai_linh_duoc']));
    const mortal = createLife({ seed: 'th2' }, content);
    expect(activityViews({ ...mortal, character: { ...mortal.character, age: 30 } }, content).some((a) => a.group === 'tu_hanh')).toBe(false);
  });

  it('hunting takes months and brings something home by realm', () => {
    let got = 0;
    for (let i = 0; i < 20; i++) {
      const s = cultivator(`th3${i}`);
      const r = doActivity(s, content, 'san_yeu_thu')!;
      expect(r.state.activities!.months).toBe(2);
      if ((r.state.inventory.noi_dan_2 ?? 0) > (s.inventory.noi_dan_2 ?? 0)) got++;
    }
    expect(got).toBeGreaterThan(5);
  });

  it('every realm event of the đại sự chains exists', () => {
    for (const id of ['ds_tc_dong_phu', 'ds_kd_linh_mach', 'ds_na_dai_vuc_moi', 'ds_ht_ngo_dao']) expect(content.events.some((e) => e.id === id)).toBe(true);
  });

  it('the Hành sự button lists Tu hành first in Tu chân giới', () => {
    const dock = content.dock.find((d) => d.id === 'hoat_dong')!;
    expect(dock.groups[0]).toBe('tu_hanh');
    expect(typeof dockGroups).toBe('function');
  });
});
