import { addDays, bahrainToday } from '../../shared/dates';
import type { RequestStatus } from '../../shared/status';

/**
 * Demo data, written relative to today so a review a week from now still sees live collabs.
 * Ids are fixed: a phone that remembers its user keeps working across a reset, and each
 * collab keeps its foil pattern.
 *
 * Noor is the creator to demo with: they hold a request in every status.
 * Barada has two staff so "two staff accept at once" can be tried on two phones,
 * and col_lastcup has one spot left with several creators waiting.
 */

const STAFF = [
  { id: 'usr_huda', name: 'Huda', cafeId: 'caf_barada' },
  { id: 'usr_yusuf', name: 'Yusuf', cafeId: 'caf_barada' },
  { id: 'usr_maryam', name: 'Maryam', cafeId: 'caf_noon' },
  { id: 'usr_khalid', name: 'Khalid', cafeId: 'caf_sidra' },
];

const CREATORS = [
  { id: 'usr_noor', name: 'Noor', handle: '@noor.sips' },
  { id: 'usr_salman', name: 'Salman', handle: '@salman.eats' },
  { id: 'usr_lulwa', name: 'Lulwa', handle: '@lulwa.films' },
  { id: 'usr_ali', name: 'Ali', handle: '@ali.around.bh' },
  { id: 'usr_fatima', name: 'Fatima', handle: '@fatima.frames' },
  { id: 'usr_reem', name: 'Reem', handle: '@reem.reviews' },
];

const CAFES = [
  { id: 'caf_barada', name: 'Barada Café', area: 'Adliya' },
  { id: 'caf_noon', name: 'Noon Roastery', area: 'Muharraq' },
  { id: 'caf_sidra', name: 'Sidra Garden', area: 'Budaiya' },
];

type SeedCollab = {
  id: string;
  cafeId: string;
  createdBy: string;
  title: string;
  offer: string;
  deliverable: string;
  spots: number;
  /** Days from today; negative means already ended. */
  endsIn: number;
};

const COLLABS: SeedCollab[] = [
  {
    id: 'col_saffron',
    cafeId: 'caf_barada',
    createdBy: 'usr_huda',
    title: 'Saffron latte first pour',
    offer: 'Two saffron lattes and a kunafa slice on the house',
    deliverable: 'One Reel of the pour, tagging Barada Café',
    spots: 5,
    endsIn: 6,
  },
  {
    id: 'col_lastcup',
    cafeId: 'caf_barada',
    createdBy: 'usr_yusuf',
    title: 'Karak tasting flight',
    offer: 'A flight of four karaks with fresh chebab',
    deliverable: 'A TikTok ranking the four, with the café tagged',
    spots: 3,
    endsIn: 3,
  },
  {
    id: 'col_brunch',
    cafeId: 'caf_barada',
    createdBy: 'usr_huda',
    title: 'Friday brunch for two',
    offer: 'Brunch for two from the new weekend menu',
    deliverable: 'A carousel of at least three photos',
    spots: 2,
    endsIn: 2,
  },
  {
    id: 'col_datecake',
    cafeId: 'caf_barada',
    createdBy: 'usr_huda',
    title: 'Date cake afternoon',
    offer: 'Date cake and gahwa for you and a friend',
    deliverable: 'One Story and one feed post',
    spots: 3,
    endsIn: -3,
  },
  {
    id: 'col_cupping',
    cafeId: 'caf_noon',
    createdBy: 'usr_maryam',
    title: 'Roastery tour and cupping',
    offer: 'A private tour and a cupping of three single origins',
    deliverable: 'A Reel from the roasting floor',
    spots: 4,
    endsIn: 10,
  },
  {
    id: 'col_coldbrew',
    cafeId: 'caf_noon',
    createdBy: 'usr_maryam',
    title: 'Date syrup cold brew',
    offer: 'Your first month of our new cold brew, one a week',
    deliverable: 'One honest review, in any format you like',
    spots: 8,
    endsIn: 14,
  },
  {
    id: 'col_sunset',
    cafeId: 'caf_sidra',
    createdBy: 'usr_khalid',
    title: 'Sunset majlis dinner',
    offer: 'Dinner for two in the garden majlis',
    deliverable: 'A golden-hour Reel from the garden',
    spots: 1,
    endsIn: 1,
  },
  {
    id: 'col_breakfast',
    cafeId: 'caf_sidra',
    createdBy: 'usr_khalid',
    title: 'Garden breakfast, today only',
    offer: 'Balaleet and eggs under the sidra tree',
    deliverable: 'A Story with the location tagged',
    spots: 6,
    endsIn: 0,
  },
];

type SeedRequest = {
  id: string;
  collabId: string;
  creatorId: string;
  pitch: string;
  status: RequestStatus;
  passCode?: string;
  postUrl?: string;
  /** Days ago the creator asked. */
  askedAgo: number;
};

const REQUESTS: SeedRequest[] = [
  // Saffron: two cups taken, three more open, a mix in the inbox.
  {
    id: 'req_saffron_noor',
    collabId: 'col_saffron',
    creatorId: 'usr_noor',
    pitch: 'I film slow pours for 12k coffee lovers in Manama.',
    status: 'accepted',
    passCode: 'FJ-7K3Q',
    askedAgo: 3,
  },
  {
    id: 'req_saffron_ali',
    collabId: 'col_saffron',
    creatorId: 'usr_ali',
    pitch: 'Weekly Adliya cafe guide, this one fits my next episode.',
    status: 'submitted',
    passCode: 'FJ-M4TZ',
    postUrl: 'https://www.instagram.com/reel/FinjanDemoAli/',
    askedAgo: 4,
  },
  {
    id: 'req_saffron_salman',
    collabId: 'col_saffron',
    creatorId: 'usr_salman',
    pitch: 'Dessert reviews are my whole page. Kunafa is my weakness.',
    status: 'pending',
    askedAgo: 1,
  },
  {
    id: 'req_saffron_lulwa',
    collabId: 'col_saffron',
    creatorId: 'usr_lulwa',
    pitch: 'I shoot cinematic latte art, happy to share the raw clips.',
    status: 'pending',
    askedAgo: 1,
  },
  {
    id: 'req_saffron_fatima',
    collabId: 'col_saffron',
    creatorId: 'usr_fatima',
    pitch: 'Would love to try this with my sister for our page.',
    status: 'declined',
    askedAgo: 2,
  },

  // Karak: one cup left and three creators waiting, for the two-staff race.
  {
    id: 'req_lastcup_reem',
    collabId: 'col_lastcup',
    creatorId: 'usr_reem',
    pitch: 'I rank everything. Karak has been waiting its turn.',
    status: 'accepted',
    passCode: 'FJ-H9WP',
    askedAgo: 3,
  },
  {
    id: 'req_lastcup_fatima',
    collabId: 'col_lastcup',
    creatorId: 'usr_fatima',
    pitch: 'My followers ask me for the best karak every single week.',
    status: 'accepted',
    passCode: 'FJ-C2RD',
    askedAgo: 2,
  },
  {
    id: 'req_lastcup_noor',
    collabId: 'col_lastcup',
    creatorId: 'usr_noor',
    pitch: 'A four-way karak taste test is exactly my kind of Reel.',
    status: 'pending',
    askedAgo: 1,
  },
  {
    id: 'req_lastcup_salman',
    collabId: 'col_lastcup',
    creatorId: 'usr_salman',
    pitch: 'Chebab and karak is my ideal breakfast, and my best format.',
    status: 'pending',
    askedAgo: 1,
  },
  {
    id: 'req_lastcup_lulwa',
    collabId: 'col_lastcup',
    creatorId: 'usr_lulwa',
    pitch: 'I can film it in one take with a spinning tray.',
    status: 'pending',
    askedAgo: 0,
  },

  // Brunch: full, with a pitch stuck waiting.
  {
    id: 'req_brunch_noor',
    collabId: 'col_brunch',
    creatorId: 'usr_noor',
    pitch: 'Weekend brunch carousels are my top posts every month.',
    status: 'submitted',
    passCode: 'FJ-8VNA',
    postUrl: 'https://www.tiktok.com/@noor.sips/video/7400000000000000000',
    askedAgo: 6,
  },
  {
    id: 'req_brunch_reem',
    collabId: 'col_brunch',
    creatorId: 'usr_reem',
    pitch: 'New menus are my favourite thing to review honestly.',
    status: 'done',
    passCode: 'FJ-Q6LE',
    postUrl: 'https://www.instagram.com/p/FinjanDemoReem/',
    askedAgo: 7,
  },
  {
    id: 'req_brunch_ali',
    collabId: 'col_brunch',
    creatorId: 'usr_ali',
    pitch: 'Could fit this into my Friday plans series.',
    status: 'pending',
    askedAgo: 2,
  },

  // Date cake: ended. One accepted creator can still post; one pitch shows as closed.
  {
    id: 'req_datecake_noor',
    collabId: 'col_datecake',
    creatorId: 'usr_noor',
    pitch: 'Date cake is my comfort food and my audience knows it.',
    status: 'done',
    passCode: 'FJ-3BXS',
    postUrl: 'https://www.instagram.com/p/FinjanDemoNoor/',
    askedAgo: 9,
  },
  {
    id: 'req_datecake_lulwa',
    collabId: 'col_datecake',
    creatorId: 'usr_lulwa',
    pitch: 'I would love to film this with my grandmother.',
    status: 'accepted',
    passCode: 'FJ-Y5GK',
    askedAgo: 8,
  },
  {
    id: 'req_datecake_salman',
    collabId: 'col_datecake',
    creatorId: 'usr_salman',
    pitch: 'Any cake, any time, honest review guaranteed.',
    status: 'pending',
    askedAgo: 5,
  },

  // Cupping: a neighbouring café, so the cross-café rule has something to show.
  {
    id: 'req_cupping_noor',
    collabId: 'col_cupping',
    creatorId: 'usr_noor',
    pitch: 'Would love to see where the beans come to life.',
    status: 'declined',
    askedAgo: 3,
  },
  {
    id: 'req_cupping_ali',
    collabId: 'col_cupping',
    creatorId: 'usr_ali',
    pitch: 'Muharraq is my next episode and roasteries are the theme.',
    status: 'pending',
    askedAgo: 1,
  },
];

function requestStatement(db: D1Database, request: SeedRequest, now: Date): D1PreparedStatement {
  const askedAt = new Date(now.getTime() - request.askedAgo * 24 * 60 * 60 * 1000).toISOString();
  const collab = COLLABS.find(({ id }) => id === request.collabId);
  const decided = request.status !== 'pending';
  const submitted = request.status === 'submitted' || request.status === 'done';

  return db
    .prepare(
      `INSERT INTO requests (id, collab_id, creator_id, pitch, status, pass_code, post_url,
                             created_at, decided_at, decided_by, submitted_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      request.id,
      request.collabId,
      request.creatorId,
      request.pitch,
      request.status,
      request.passCode ?? null,
      request.postUrl ?? null,
      askedAt,
      decided ? askedAt : null,
      decided ? (collab?.createdBy ?? null) : null,
      submitted ? askedAt : null,
      request.status === 'done' ? askedAt : null,
    );
}

/** Replaces everything in one batch, so readers never see a half-seeded database. */
export async function seed(db: D1Database, now: Date = new Date()): Promise<void> {
  const today = bahrainToday(now);
  const nowIso = now.toISOString();

  await db.batch([
    db.prepare('DELETE FROM requests'),
    db.prepare('DELETE FROM collabs'),
    db.prepare('DELETE FROM users'),
    db.prepare('DELETE FROM cafes'),
    ...CAFES.map((cafe) =>
      db
        .prepare('INSERT INTO cafes (id, name, area) VALUES (?, ?, ?)')
        .bind(cafe.id, cafe.name, cafe.area),
    ),
    ...STAFF.map((user) =>
      db
        .prepare(
          `INSERT INTO users (id, name, role, cafe_id, avatar_seed)
           VALUES (?, ?, 'cafe_staff', ?, ?)`,
        )
        .bind(user.id, user.name, user.cafeId, user.id),
    ),
    ...CREATORS.map((user) =>
      db
        .prepare(
          `INSERT INTO users (id, name, role, handle, avatar_seed)
           VALUES (?, ?, 'creator', ?, ?)`,
        )
        .bind(user.id, user.name, user.handle, user.id),
    ),
    ...COLLABS.map((collab) =>
      db
        .prepare(
          `INSERT INTO collabs (id, cafe_id, title, offer, deliverable, spots, ends_on,
                                created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          collab.id,
          collab.cafeId,
          collab.title,
          collab.offer,
          collab.deliverable,
          collab.spots,
          addDays(today, collab.endsIn),
          collab.createdBy,
          nowIso,
        ),
    ),
    ...REQUESTS.map((request) => requestStatement(db, request, now)),
    db
      .prepare(
        `INSERT INTO demo_meta (key, value) VALUES ('last_reset_at', ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      )
      .bind(nowIso),
  ]);
}

export async function seedIfEmpty(db: D1Database): Promise<void> {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM users').first<{ count: number }>();
  if (row?.count === 0) await seed(db);
}

export async function lastResetAt(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(`SELECT value FROM demo_meta WHERE key = 'last_reset_at'`)
    .first<{ value: string }>();
  return row?.value ?? null;
}
