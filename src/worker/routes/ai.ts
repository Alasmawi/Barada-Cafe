import { Hono } from 'hono';
import { bahrainToday } from '../../shared/dates';
import { DraftRequest } from '../../shared/schemas';
import { workersAiClient } from '../ai/aiClient';
import { draftCollab } from '../ai/draftCollab';
import type { AppEnv } from '../env';
import { parseBody } from '../http/validate';
import { assertStaff } from '../services/permissions';

export const aiRoutes = new Hono<AppEnv>().post('/ai/draft-collab', async (c) => {
  assertStaff(c.get('actor'));
  const { sentence } = await parseBody(c, DraftRequest);
  const draft = await draftCollab(
    workersAiClient(c.env.AI),
    sentence,
    bahrainToday(),
    c.req.raw.signal,
  );
  return c.json(draft);
});
