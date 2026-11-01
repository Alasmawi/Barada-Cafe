import { Hono } from 'hono';
import type { AppEnv } from './env';
import { actingUser } from './http/actingUser';
import { handleError, notFound } from './http/errors';
import { collabRoutes } from './routes/collabs';
import { publicRoutes } from './routes/public';
import { requestRoutes } from './routes/requests';

const app = new Hono<AppEnv>().basePath('/api/v1');

app.onError(handleError);
app.notFound(() => {
  throw notFound("There's nothing here.");
});

app.route('/', publicRoutes);
app.use(actingUser);
app.route('/', collabRoutes);
app.route('/', requestRoutes);

export default app;
