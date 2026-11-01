import { z } from 'zod';
import { isHttpsUrl } from './postLink';

export const SPOTS_MIN = 1;
export const SPOTS_MAX = 50;
export const PITCH_MAX = 140;

export const CollabInput = z.object({
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

export const CollabListQuery = z.object({
  state: z.enum(['open', 'full']).optional(),
});
