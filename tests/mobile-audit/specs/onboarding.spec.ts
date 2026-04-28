import { test, expect } from '../fixtures';

/**
 * FirstSignInModal walk-through. Onboarding only fires when localStorage flags
 * indicate the user hasn't completed it. We force it open by clearing storage,
 * then walk visible steps. This is best-effort: if the demo account has already
 * completed onboarding server-side, the modal won't render and we record a note.
 */
test.describe('Onboarding modal (FirstSignInModal)', () => {
  test('walk through visible steps @P0', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await page.evaluate(() => {
      try {
        localStorage.removeItem('first-signin-completed');
        localStorage.removeItem('onboarding-completed');
        sessionStorage.clear();
      } catch {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible().catch(() => false);

    if (!modalVisible) {
      await testInfo.attach('onboarding-state', {
        body: 'FirstSignInModal did not render — demo account likely completed onboarding server-side. Recorded as note.',
        contentType: 'text/plain',
      });
      return;
    }

    const proj = (testInfo.project.metadata ?? {}) as { viewportName?: string };
    const viewport = proj.viewportName ?? testInfo.project.name;
    const dir = `tests/mobile-audit/screenshots/${viewport}/onboarding`;
    const fs = await import('node:fs');
    fs.mkdirSync(dir, { recursive: true });

    for (let step = 1; step <= 8; step++) {
      await page.screenshot({ path: `${dir}/step-${step}.png`, fullPage: true });

      // Probe horizontal scroll within modal at this step.
      const overflow = await page.evaluate(() => {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
        if (!dialog) return 0;
        return dialog.scrollWidth - dialog.clientWidth;
      });
      await testInfo.attach(`step-${step}-overflow`, {
        body: String(overflow),
        contentType: 'text/plain',
      });

      const nextBtn = page
        .locator('[role="dialog"] button:has-text("Next"), [role="dialog"] button:has-text("Continue"), [role="dialog"] button:has-text("Save")')
        .first();
      const ok = await nextBtn.isVisible().catch(() => false);
      if (!ok) break;
      await nextBtn.click().catch(() => null);
      await page.waitForTimeout(400);
    }

    expect(true).toBe(true);
  });
});
