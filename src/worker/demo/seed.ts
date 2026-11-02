import { addDays, bahrainToday } from '../../shared/dates';
import type { RequestStatus } from '../../shared/status';

/**
 * Demo data, written relative to today so a review a week from now still sees live collabs.
 * Ids are fixed: a phone that remembers its user keeps working across a reset, and each
 * collab keeps its foil pattern.
 *
 * Noor is the creator to demo with: they hold a request in every status.
 * Five businesses of different kinds show that the board isn't only for cafés.
 * Each business has one account. Logging in as Barada on two phones shows the spot rule,
 * as col_lastcup has one spot left with several creators waiting.
 */

/** Every demo account uses this password. It's printed in the README, because this is a demo. */
export const DEMO_PASSWORD = 'demo-password';
/** Hashed ahead of time: hashing it per user on each reset would overrun the free CPU limit. */
export const DEMO_PASSWORD_HASH =
  'pbkdf2$10000$66ed457e62dfeb9c1eb48f8a122c0db8$bafa10f2303e3a6176e8b661dc61a95f5af9d9a5199ddd5ce76270362033063c';

const BUSINESS_ACCOUNTS = [
  { id: 'usr_barada', username: 'barada', name: 'Barada Café', businessId: 'biz_barada' },
  { id: 'usr_noon', username: 'noon', name: 'Noon Roastery', businessId: 'biz_noon' },
  { id: 'usr_sidra', username: 'sidra', name: 'Sidra Garden', businessId: 'biz_sidra' },
  { id: 'usr_layali', username: 'layali', name: 'Layali Perfumes', businessId: 'biz_layali' },
  { id: 'usr_move', username: 'move', name: 'Move Studio', businessId: 'biz_move' },
];

const CREATORS = [
  { id: 'usr_noor', username: 'noor', name: 'Noor', handle: '@noor.sips', tags: 'Coffee,Food,Reels,Calm', signature: 'Slow pours, quiet mornings.', socials: { instagram: 'noor.sips', tiktok: 'noorsips' } },
  { id: 'usr_salman', username: 'salman', name: 'Salman', handle: '@salman.eats', tags: 'Food,Beauty,Fashion,TikTok,Playful', signature: 'Loud, honest, hungry.', socials: { tiktok: 'salman.eats', snapchat: 'salmaneats' } },
  { id: 'usr_lulwa', username: 'lulwa', name: 'Lulwa', handle: '@lulwa.films', tags: 'Film,Stories,Bold', signature: 'Every frame on purpose.', socials: { instagram: 'lulwa.films', youtube: 'lulwafilms', x: 'lulwafilms' } },
  { id: 'usr_ali', username: 'ali', name: 'Ali', handle: '@ali.around.bh', tags: 'Travel,Coffee,Food,Fitness,Carousels,Playful', signature: 'Bahrain, one corner at a time.', socials: { instagram: 'ali.around.bh', youtube: 'alialaround' } },
  { id: 'usr_fatima', username: 'fatima', name: 'Fatima', handle: '@fatima.frames', tags: 'Fashion,Film,Reels,Calm', signature: 'Quiet colour, clean lines.', socials: { instagram: 'fatima.frames' } },
  { id: 'usr_reem', username: 'reem', name: 'Reem', handle: '@reem.reviews', tags: 'Beauty,Fashion,Carousels,Stories,Calm', signature: 'Reviews you can trust.', socials: { instagram: 'reem.reviews', tiktok: 'reemreviews' } },
];

const BUSINESSES = [
  { id: 'biz_barada', name: 'Barada Café', area: 'Adliya', type: 'Café', house: 'saffron' },
  { id: 'biz_noon', name: 'Noon Roastery', area: 'Muharraq', type: 'Café', house: 'gulf' },
  { id: 'biz_sidra', name: 'Sidra Garden', area: 'Budaiya', type: 'Restaurant', house: 'sage' },
  { id: 'biz_layali', name: 'Layali Perfumes', area: 'Seef', type: 'Beauty', house: 'oud' },
  { id: 'biz_move', name: 'Move Studio', area: 'Juffair', type: 'Fitness', house: 'coral' },
];

const quoted = (ids: string[]) => ids.map((id) => `'${id}'`).join(', ');
const DEMO_USER_IDS = quoted([...BUSINESS_ACCOUNTS, ...CREATORS].map(({ id }) => id));
const DEMO_BUSINESS_IDS = quoted(BUSINESSES.map(({ id }) => id));

type SeedCollab = {
  id: string;
  details?: string;
  requirements?: string;
  location?: string;
  businessId: string;
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
    id: 'col_oud',
    details: "Spend an evening with our perfumer learning how oud is blended, then make your own bottle to take home. Sessions run after closing, so you'll have the shop to yourself.",
    requirements: "Beauty or lifestyle creators who like slow, detailed content.",
    location: "Layali Perfumes, Seef",
    businessId: 'biz_layali',
    createdBy: 'usr_layali',
    title: 'An evening of oud',
    offer: 'A private fragrance session and a bottle of your own blend',
    deliverable: 'One Reel of the blending, tagging Layali',
    spots: 2,
    endsIn: 3,
  },
  {
    id: 'col_mat',
    details: "Join any class across four weeks. We'd love an honest look at how it feels to start from scratch, so no fitness background is needed.",
    requirements: "Anyone curious about starting mat classes. Beginners are welcome.",
    location: "Move Studio, Juffair",
    businessId: 'biz_move',
    createdBy: 'usr_move',
    title: 'A month of mat classes',
    offer: 'Four weeks of mat classes, on the house',
    deliverable: 'Three Stories showing your first, middle and last class',
    spots: 2,
    endsIn: 5,
  },

  {
    id: 'col_saffron',
    details: "We're launching a saffron latte this month and want it to feel like a slow, cosy treat. Come on a weekday morning when the light is best, and our baristas will make it with you.",
    requirements: "Food or coffee creators in Bahrain, comfortable filming in a busy café.",
    location: "Barada Café, Adliya",
    businessId: 'biz_barada',
    createdBy: 'usr_barada',
    title: 'Saffron latte first pour',
    offer: 'Two saffron lattes and a kunafa slice on the house',
    deliverable: 'One Reel of the pour, tagging Barada Café',
    spots: 5,
    endsIn: 6,
  },
  {
    id: 'col_lastcup',
    businessId: 'biz_barada',
    createdBy: 'usr_barada',
    title: 'Karak tasting flight',
    offer: 'A flight of four karaks with fresh chebab',
    deliverable: 'A TikTok ranking the four, with the café tagged',
    spots: 3,
    endsIn: 3,
  },
  {
    id: 'col_brunch',
    businessId: 'biz_barada',
    createdBy: 'usr_barada',
    title: 'Friday brunch for two',
    offer: 'Brunch for two from the new weekend menu',
    deliverable: 'A carousel of at least three photos',
    spots: 2,
    endsIn: 2,
  },
  {
    id: 'col_datecake',
    businessId: 'biz_barada',
    createdBy: 'usr_barada',
    title: 'Date cake afternoon',
    offer: 'Date cake and gahwa for you and a friend',
    deliverable: 'One Story and one feed post',
    spots: 3,
    endsIn: -3,
  },
  {
    id: 'col_cupping',
    businessId: 'biz_noon',
    createdBy: 'usr_noon',
    title: 'Roastery tour and cupping',
    offer: 'A private tour and a cupping of three single origins',
    deliverable: 'A Reel from the roasting floor',
    spots: 4,
    endsIn: 10,
  },
  {
    id: 'col_coldbrew',
    businessId: 'biz_noon',
    createdBy: 'usr_noon',
    title: 'Date syrup cold brew',
    offer: 'Your first month of our new cold brew, one a week',
    deliverable: 'One honest review, in any format you like',
    spots: 8,
    endsIn: 14,
  },
  {
    id: 'col_sunset',
    businessId: 'biz_sidra',
    createdBy: 'usr_sidra',
    title: 'Sunset majlis dinner',
    offer: 'Dinner for two in the garden majlis',
    deliverable: 'A golden-hour Reel from the garden',
    spots: 1,
    endsIn: 1,
  },
  {
    id: 'col_breakfast',
    businessId: 'biz_sidra',
    createdBy: 'usr_sidra',
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
  // Layali invited Noor, which is how a creator sees an invite in the demo.
  {
    id: 'req_oud_noor',
    collabId: 'col_oud',
    creatorId: 'usr_noor',
    pitch: '',
    status: 'invited',
    askedAgo: 0,
  },

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
    pitch: 'Weekly Adliya business guide, this one fits my next episode.',
    status: 'submitted',
    passCode: 'FJ-M4TZ',
    postUrl: 'https://www.instagram.com/reel/DemoPostAli/',
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

  // Karak: one cup left and three creators waiting, for the two-phone race.
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
    postUrl: 'https://www.instagram.com/p/DemoPostReem/',
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
    postUrl: 'https://www.instagram.com/p/DemoPostNoor/',
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
  const decided = request.status !== 'pending' && request.status !== 'invited';
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
    // Demo accounts keep their rows, so a reset never logs out someone else who's reviewing.
    db.prepare(`DELETE FROM sessions WHERE user_id NOT IN (${DEMO_USER_IDS})`),
    db.prepare('DELETE FROM requests'),
    db.prepare('DELETE FROM collabs'),
    db.prepare(`DELETE FROM users WHERE id NOT IN (${DEMO_USER_IDS})`),
    db.prepare(`DELETE FROM businesses WHERE id NOT IN (${DEMO_BUSINESS_IDS})`),
    ...BUSINESSES.map((business) =>
      db
        .prepare(
          `INSERT INTO businesses (id, name, area, type, house) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             name = excluded.name, area = excluded.area, type = excluded.type, house = excluded.house`,
        )
        .bind(business.id, business.name, business.area, business.type, business.house),
    ),
    ...BUSINESS_ACCOUNTS.map((user) =>
      db
        .prepare(
          `INSERT INTO users (id, username, password_hash, name, role, business_id)
           VALUES (?, ?, ?, ?, 'business', ?)
           ON CONFLICT (id) DO UPDATE SET password_hash = excluded.password_hash`,
        )
        .bind(user.id, user.username, DEMO_PASSWORD_HASH, user.name, user.businessId),
    ),
    ...CREATORS.map((user) =>
      db
        .prepare(
          `INSERT INTO users (id, username, password_hash, name, role, handle, tags, signature, socials)
           VALUES (?, ?, ?, ?, 'creator', ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             tags = excluded.tags, signature = excluded.signature, socials = excluded.socials,
             summary = NULL, summary_key = NULL`,
        )
        .bind(
          user.id,
          user.username,
          DEMO_PASSWORD_HASH,
          user.name,
          user.handle,
          user.tags,
          user.signature,
          JSON.stringify(user.socials),
        ),
    ),
    ...COLLABS.map((collab) =>
      db
        .prepare(
          `INSERT INTO collabs (id, business_id, title, offer, deliverable, details,
                                requirements, location, spots, ends_on, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          collab.id,
          collab.businessId,
          collab.title,
          collab.offer,
          collab.deliverable,
          collab.details ?? '',
          collab.requirements ?? '',
          collab.location ?? '',
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
