import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/core/content';
import { createLife, fillTemplate } from '../src/core/state';
import { findEvent } from '../src/systems/events/engine';
import { checkDeath } from '../src/systems/time';

const content = loadContent();

describe('playtest 2026-10-12 bugs', () => {
  it('event titles fill their placeholders', () => {
    const s = createLife({ seed: 'b1' }, content);
    expect(fillTemplate(findEvent(content, 'pt_om_nang')!.title, s, content)).not.toContain('{');
  });

  it('a cultivator is not mourned as a mortal', () => {
    const b = createLife({ seed: 'b9' }, content);
    const dead = checkDeath({ ...b, cult: { ...b.cult, realm: 'truc_co', lifespan: 0 }, karma: 0 }, content, 'old_age');
    expect(content.lifeTexts.epitaph.plainCultivator).toContain(dead.death!.epitaph);
  });
});
