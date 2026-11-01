import { z } from 'zod';
import { BUSINESS_TYPES, HOUSE_NAMES } from './houses';
import { isHttpsUrl } from './postLink';
import { isValidTagSet } from './tags';

export const SPOTS_MIN = 1;
export const SPOTS_MAX = 50;
export const PITCH_MAX = 140;

export const COLLAB_KINDS = ['collab', 'offer'] as const;
export type CollabKind = (typeof COLLAB_KINDS)[number];

export const CollabInput = z.object({
  kind: z.enum(COLLAB_KINDS, 'Choose collab or offer').default('collab'),
  title: z.string().trim().min(1, 'Give the collab a title').max(80, 'Keep the title under 80 characters'),
  offer: z.string().trim().min(1, "Say what you're offering").max(200, 'Keep the offer under 200 characters'),
  deliverable: z.string().trim().min(1, 'Say what to post').max(300, 'Keep this under 300 characters'),
  spots: z
    .number('Choose the number of spots')
    .int('Spots must be a whole number')
    .min(SPOTS_MIN, `At least ${SPOTS_MIN} spot`)
    .max(SPOTS_MAX, `At most ${SPOTS_MAX} spots`),
  endsOn: z.iso.date('Choose an end date'),
});
export type CollabInput = z.infer<typeof CollabInput>;

export const PitchInput = z.object({
  pitch: z
    .string()
    .trim()
    .min(1, 'Write one line about why this fits you')
    .max(PITCH_MAX, `Keep your pitch to ${PITCH_MAX} characters`),
});
export type PitchInput = z.infer<typeof PitchInput>;

export const SubmissionInput = z.object({
  postUrl: z
    .string()
    .trim()
    .max(500, 'That link is too long')
    .refine(isHttpsUrl, "That doesn't look like a link — it should start with https://"),
});
export type SubmissionInput = z.infer<typeof SubmissionInput>;

export const SENTENCE_MAX = 300;

export const DraftRequest = z.object({
  sentence: z
    .string()
    .trim()
    .min(1, 'Describe your collab in a sentence')
    .max(SENTENCE_MAX, `Keep it to ${SENTENCE_MAX} characters`),
});
export type DraftRequest = z.infer<typeof DraftRequest>;

const Credentials = {
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._]{3,24}$/, 'Use 3 to 24 letters, numbers, dots or underscores'),
  password: z.string().min(8, 'Use at least 8 characters').max(72, 'Keep it under 72 characters'),
};

export const LoginInput = z.object({
  username: z.string().trim().toLowerCase().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const CreatorSignUp = z.object({
  ...Credentials,
  role: z.literal('creator'),
  name: z.string().trim().min(1, 'Add your name').max(40, 'Keep it under 40 characters'),
  handle: z
    .string()
    .trim()
    .regex(/^@[a-zA-Z0-9._]{2,30}$/, 'Start with @, like @noor.sips'),
  signature: z.string().trim().max(60, 'Keep it to one short line').default(''),
  tags: z.array(z.string()).refine(isValidTagSet, 'Pick what you make, a format and a vibe'),
});
export type CreatorSignUp = z.infer<typeof CreatorSignUp>;

export const BusinessSignUp = z.object({
  ...Credentials,
  role: z.literal('business'),
  businessName: z.string().trim().min(1, 'Add your business name').max(40, 'Keep it under 40 characters'),
  area: z.string().trim().min(1, 'Add your area').max(40, 'Keep it under 40 characters'),
  businessType: z.enum(BUSINESS_TYPES, 'Choose what kind of business'),
  house: z.enum(HOUSE_NAMES, 'Choose a house'),
});
export type BusinessSignUp = z.infer<typeof BusinessSignUp>;

export const SignUpInput = z.discriminatedUnion('role', [CreatorSignUp, BusinessSignUp]);
export type SignUpInput = z.infer<typeof SignUpInput>;

export const CreatorSearchQuery = z.object({
  q: z.string().trim().max(60).default(''),
});

export const InviteInput = z.object({ creatorId: z.string().min(1) });

export const CollabListQuery = z.object({
  state: z.enum(['open', 'full']).optional(),
});
