import { describe, expect, it } from 'vitest';
import {
  accept,
  api,
  askToJoin,
  countHeldSpots,
  errorCode,
  getCollab,
  makeCollab,
  makeCreators,
  nextWeek,
} from './helpers';

/**
 * The rule from the brief: a collab never accepts more creators than it has spots, even
 * with a double tap or two staff accepting at the same moment.
 *
 * Each race fires real HTTP requests at the Worker in parallel. The final assertion reads
 * the database directly, so a wrong API response can't hide an overbooked collab.
 *
 * The local runtime gives the first request in a batch a one-step head start: its UPDATE
 * lands before the others run their reads. So a race for the last spot could pass even
 * with a broken guard, because the rest already see it taken. `pacer()` is an unrelated
 * request fired first to absorb that head start, leaving the real contenders overlapping.
 * We confirmed these tests fail when the guard is replaced by "SELECT count, then UPDATE".
 */

const statuses = (responses: Response[]) => responses.map(({ status }) => status).sort();

async function makePacer(): Promise<() => Promise<Response>> {
  const { staff, requestIds } = await makeCollab({ spots: 1, pending: 1 });
  return () => accept(requestIds[0]!, staff[0]!);
}

describe('the spot invariant', () => {
  it('accepts exactly 2 of 5 when 5 staff accept at once on a 2-spot collab', async () => {
    const { collabId, staff, requestIds } = await makeCollab({
      spots: 2,
      pending: 5,
      staffCount: 5,
    });

    const responses = await Promise.all(
      requestIds.map((requestId, index) => accept(requestId, staff[index]!)),
    );

    expect(statuses(responses)).toEqual([200, 200, 409, 409, 409]);
    const refused = responses.filter(({ status }) => status === 409);
    expect(await Promise.all(refused.map(errorCode))).toEqual(Array(3).fill('COLLAB_FULL'));
    expect(await countHeldSpots(collabId)).toBe(2);
  });

  it('treats a double tap on accept as one acceptance and answers both taps with 200', async () => {
    const { collabId, staff, requestIds } = await makeCollab({ spots: 2, pending: 2 });
    const [staffId, requestId] = [staff[0]!, requestIds[0]!];

    const [first, second] = await Promise.all([
      accept(requestId, staffId),
      accept(requestId, staffId),
    ]);

    expect([first.status, second.status]).toEqual([200, 200]);
    const [a, b] = await Promise.all(
      [first, second].map((response) =>
        response.json<{ request: { passCode: string } }>(),
      ),
    );
    expect(a!.request.passCode).toBe(b!.request.passCode);
    expect(await countHeldSpots(collabId)).toBe(1);
  });

  it('lets only one of two staff take the last spot', async () => {
    for (let round = 0; round < 20; round += 1) {
      const { collabId, staff, requestIds } = await makeCollab({
        spots: 1,
        pending: 2,
        staffCount: 2,
      });
      const pacer = await makePacer();

      const [, ...responses] = await Promise.all([
        pacer(),
        accept(requestIds[0]!, staff[0]!),
        accept(requestIds[1]!, staff[1]!),
      ]);

      expect(statuses(responses)).toEqual([200, 409]);
      expect(await countHeldSpots(collabId)).toBe(1);
    }
  });

  it('keeps the spot count correct across 20 repeated races', async () => {
    for (let round = 0; round < 20; round += 1) {
      const { collabId, staff, requestIds } = await makeCollab({
        spots: 2,
        pending: 5,
        staffCount: 5,
      });

      await Promise.all(requestIds.map((requestId, index) => accept(requestId, staff[index]!)));

      expect(await countHeldSpots(collabId)).toBe(2);
    }
  });

  it('never lets a spots reduction and an accept together exceed spots', async () => {
    for (let round = 0; round < 20; round += 1) {
      const { collabId, staff, requestIds } = await makeCollab({ spots: 3, pending: 3 });
      const [staffId, first, second, third] = [
        staff[0]!,
        requestIds[0]!,
        requestIds[1]!,
        requestIds[2]!,
      ];
      await accept(first, staffId);
      const pacer = await makePacer();

      await Promise.all([
        pacer(),
        api(`/collabs/${collabId}`, {
          as: staffId,
          method: 'PUT',
          body: {
            title: 'Test collab',
            offer: 'A free latte',
            deliverable: 'One Reel',
            spots: 1,
            endsOn: nextWeek(),
          },
        }),
        accept(second, staffId),
        accept(third, staffId),
      ]);

      // Either side may win. What matters is that the stored numbers still agree.
      const { spots } = await getCollab(collabId, staffId);
      expect(await countHeldSpots(collabId)).toBeLessThanOrEqual(spots);
    }
  });

  it('stops new requests once a collab is full', async () => {
    const { collabId, staff, requestIds } = await makeCollab({ spots: 1, pending: 1 });
    const [late] = await makeCreators(1);
    await accept(requestIds[0]!, staff[0]!);

    const response = await askToJoin(collabId, late!);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('COLLAB_FULL');
  });

  it('turns a double tap on Send my pitch into one request', async () => {
    const { collabId } = await makeCollab({ spots: 2 });
    const [creator] = await makeCreators(1);

    const responses = await Promise.all([
      askToJoin(collabId, creator!),
      askToJoin(collabId, creator!),
    ]);

    expect(statuses(responses)).toEqual([200, 201]);
    const ids = await Promise.all(
      responses.map(async (response) => {
        const { request } = await response.json<{ request: { id: string } }>();
        return request.id;
      }),
    );
    expect(ids[0]).toBe(ids[1]);
  });
});
