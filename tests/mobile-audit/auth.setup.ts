import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STORAGE_STATE = 'playwright/.auth/user.json';
const EMAIL = process.env.AUDIT_EMAIL ?? 'demo@zenible.com';
const PASSWORD = process.env.AUDIT_PASSWORD ?? 'demo123';

setup('authenticate', async ({ page, context }) => {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  // Reuse storageState if it's <12h old.
  if (fs.existsSync(STORAGE_STATE)) {
    const ageMs = Date.now() - fs.statSync(STORAGE_STATE).mtimeMs;
    if (ageMs < 12 * 60 * 60 * 1000) {
      console.log(`[auth.setup] reusing storageState (age ${(ageMs / 60000).toFixed(0)}m)`);
      return;
    }
  }

  await page.goto('/signin');

  // Email + password fields. Selectors are best-effort; fall back to first matching input.
  const emailInput = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await emailInput.fill(EMAIL);
  await passwordInput.fill(PASSWORD);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/signin'), { timeout: 30_000 }).catch(() => null),
    page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click(),
  ]);

  // Confirm we're authenticated (any non-/signin URL).
  await expect(page).not.toHaveURL(/\/signin/);

  await context.storageState({ path: STORAGE_STATE });
  console.log(`[auth.setup] saved storageState to ${STORAGE_STATE}`);
});
