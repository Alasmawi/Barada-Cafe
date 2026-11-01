import { Hono } from 'hono';
import { CollabInput, CollabListQuery, InviteInput, PitchInput } from '../../shared/schemas';
import type { AppEnv } from '../env';
import { parse, parseBody } from '../http/validate';
import * as collabService from '../services/collabService';
import * as requestService from '../services/requestService';

export const collabRoutes = new Hono<AppEnv>()
  .get('/collabs', async (c) => {
    const { state } = parse(CollabListQuery, c.req.query());
    return c.json({ collabs: await collabService.listFeed(c.env.DB, state) });
  })
  .post('/collabs', async (c) => {
    const input = await parseBody(c, CollabInput);
    const collab = await collabService.create(c.env.DB, c.get('actor'), input);
    return c.json({ collab }, 201);
  })
  .get('/collabs/:id', async (c) => {
    return c.json(await collabService.getDetail(c.env.DB, c.get('actor'), c.req.param('id')));
  })
  .put('/collabs/:id', async (c) => {
    const input = await parseBody(c, CollabInput);
    const collab = await collabService.update(c.env.DB, c.get('actor'), c.req.param('id'), input);
    return c.json({ collab });
  })
  .get('/collabs/:id/requests', async (c) => {
    const requests = await requestService.listInbox(c.env.DB, c.get('actor'), c.req.param('id'));
    return c.json({ requests });
  })
  .post('/collabs/:id/requests', async (c) => {
    const { pitch } = await parseBody(c, PitchInput);
    const { request, created } = await requestService.ask(
      c.env.DB,
      c.get('actor'),
      c.req.param('id'),
      pitch,
    );
    return c.json({ request }, created ? 201 : 200);
  })
  .post('/collabs/:id/invites', async (c) => {
    const { creatorId } = await parseBody(c, InviteInput);
    const { request, created } = await requestService.invite(
      c.env.DB,
      c.get('actor'),
      c.req.param('id'),
      creatorId,
    );
    return c.json({ request }, created ? 201 : 200);
  })
  .get('/business/collabs', async (c) => {
    return c.json({ collabs: await collabService.listForBusiness(c.env.DB, c.get('actor')) });
  });
