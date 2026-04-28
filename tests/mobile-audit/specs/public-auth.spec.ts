import { test } from '../fixtures';
import { ROUTES } from '../routes';

test.describe('Public auth pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of ROUTES.filter((r) => r.group === 'auth-public')) {
    test(`${route.path} @${route.priority}`, async ({ auditPage }) => {
      await auditPage(route);
    });
  }
});
