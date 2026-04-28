import { test } from '../fixtures';
import { ROUTES } from '../routes';

const AUTHED_GROUPS = ['dashboard', 'crm', 'finance', 'calendar', 'boardroom', 'tools', 'settings'] as const;

for (const group of AUTHED_GROUPS) {
  test.describe(`Authed: ${group}`, () => {
    for (const route of ROUTES.filter((r) => r.group === group && r.auth === 'authed' && !r.skip)) {
      test(`${route.path} @${route.priority}`, async ({ auditPage }) => {
        await auditPage(route);
      });
    }
  });
}
