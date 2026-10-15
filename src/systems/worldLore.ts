// 9.R7c: who lives in each đại vực (phàm quốc, tu tiên thế gia, peoples, giang hồ forces), for the map.
import type { Content } from '../core/content';

export interface RegionLore {
  nations: string[];
  clans: string[];
  races: string[];
  factions: string[];
}

export function regionLore(content: Content, regionId: string): RegionLore {
  return {
    nations: (content.nations ?? []).filter((n) => n.region === regionId).map((n) => n.name),
    clans: (content.worldClans ?? []).filter((c) => c.region === regionId).map((c) => `${c.name} (${c.craft.toLocaleLowerCase('vi')})`),
    races: (content.races ?? []).filter((r) => r.regions.includes(regionId)).map((r) => r.name),
    factions: (content.jianghuFactions ?? []).filter((f) => f.region === regionId).map((f) => f.name),
  };
}
