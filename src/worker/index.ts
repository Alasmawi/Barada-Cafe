import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './env';
import { actingUser } from './http/actingUser';
import { handleError, notFound } from './http/errors';
import { aiRoutes } from './routes/ai';
import { authRoutes } from './routes/auth';
import { collabRoutes } from './routes/collabs';
import { creatorRoutes } from './routes/creators';
import { publicRoutes } from './routes/public';
import { requestRoutes } from './routes/requests';

const app = new Hono<AppEnv>().basePath('/api/v1');

app.use(secureHeaders());
app.onError(handleError);
app.notFound(() => {
  throw notFound("There's nothing here.");
});

app.route('/', publicRoutes);
app.route('/', authRoutes);
app.use(actingUser);
app.route('/', collabRoutes);
app.route('/', aiRoutes);
app.route('/', creatorRoutes);
app.route('/', requestRoutes);

export default app;
