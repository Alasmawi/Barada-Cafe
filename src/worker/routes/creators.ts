import { Hono } from 'hono';
import { CreatorSearchQuery } from '../../shared/schemas';
import { workersAiClient } from '../ai/aiClient';
import type { AppEnv } from '../env';
import { parse } from '../http/validate';
import * as creatorService from '../services/creatorService';

export const creatorRoutes = new Hono<AppEnv>()
  .get('/creators', async (c) => {
    const { q } = parse(CreatorSearchQuery, c.req.query());
    return c.json({ creators: await creatorService.search(c.env.DB, c.get('actor'), q) });
  })
  .post('/creators/:id/summary', async (c) => {
    const creator = await creatorService.summarize(
      c.env.DB,
      workersAiClient(c.env.AI),
      c.get('actor'),
      c.req.param('id'),
    );
    return c.json({ creator });
  });
