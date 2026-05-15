import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { participants } from './participants';

describe('participant images', () => {
  it('has local performance and portrait images for every finalist', () => {
    for (const participant of participants) {
      expect(participant.images?.performance?.src, participant.country).toBeTruthy();
      expect(participant.images?.portrait?.src, participant.country).toBeTruthy();
      expect(participant.images?.performance?.credit, participant.country).toContain('©');
      expect(participant.images?.portrait?.credit, participant.country).toContain('©');

      const performancePath = join(process.cwd(), 'public', participant.images!.performance!.src);
      const portraitPath = join(process.cwd(), 'public', participant.images!.portrait!.src);

      expect(existsSync(performancePath), participant.country).toBe(true);
      expect(existsSync(portraitPath), participant.country).toBe(true);
    }
  });
});
