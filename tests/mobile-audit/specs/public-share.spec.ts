import { test } from '../fixtures';
import { ROUTES } from '../routes';

test.describe('Public share-link pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of ROUTES.filter((r) => r.group === 'public-share')) {
    test(`${route.path} @${route.priority}`, async ({ auditPage }) => {
      await auditPage(route);
    });
  }
});
