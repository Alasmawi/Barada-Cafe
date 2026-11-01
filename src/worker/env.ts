import type { User } from '../shared/api';

export type AppEnv = {
  Bindings: Cloudflare.Env;
  Variables: { actor: User };
};
