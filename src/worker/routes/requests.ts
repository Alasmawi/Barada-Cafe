import { Hono } from 'hono';
import { SubmissionInput } from '../../shared/schemas';
import { SocialsInput } from '../../shared/socials';
import type { AppEnv } from '../env';
import { parseBody } from '../http/validate';
import { workersAiClient } from '../ai/aiClient';
import * as creatorService from '../services/creatorService';
import * as pickService from '../services/pickService';
import * as requestService from '../services/requestService';

export const requestRoutes = new Hono<AppEnv>()
  .get('/me', (c) => c.json({ user: c.get('actor') }))
  .put('/me/socials', async (c) => {
    const socials = await parseBody(c, SocialsInput);
    const user = await creatorService.updateSocials(c.env.DB, c.get('actor'), socials);
    return c.json({ user });
  })
  .get('/me/picks', async (c) => c.json(await pickService.list(c.env.DB, c.get('actor'))))
  .post('/me/picks/explain', async (c) =>
    c.json(await pickService.explain(c.env.DB, workersAiClient(c.env.AI), c.get('actor'))),
  )
  .get('/me/requests', async (c) => {
    return c.json({ requests: await requestService.listMine(c.env.DB, c.get('actor')) });
  })
  .get('/requests/:id', async (c) => {
    const request = await requestService.getOne(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ request });
  })
  .post('/requests/:id/accept', async (c) => {
    const request = await requestService.accept(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ request });
  })
  .post('/requests/:id/accept-invite', async (c) => {
    const request = await requestService.acceptInvite(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ request });
  })
  .post('/requests/:id/decline-invite', async (c) => {
    const request = await requestService.declineInvite(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ request });
  })
  .post('/requests/:id/decline', async (c) => {
    const request = await requestService.decline(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ request });
  })
  .post('/requests/:id/submission', async (c) => {
    const { postUrl } = await parseBody(c, SubmissionInput);
    const request = await requestService.submitLink(
      c.env.DB,
      c.get('actor'),
      c.req.param('id'),
      postUrl,
    );
    return c.json({ request });
  })
  .post('/requests/:id/complete', async (c) => {
    const request = await requestService.complete(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ request });
  });
