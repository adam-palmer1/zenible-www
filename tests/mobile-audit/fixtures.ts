import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { Route } from './routes';

export interface OverflowFinding {
  selector: string;
  rect: { x: number; y: number; width: number; height: number };
  overflowPx: number;
  text: string;
  classes: string;
}

export interface SmallTouchTarget {
  selector: string;
  width: number;
  height: number;
  text: string;
}

export interface AuditResult {
  route: string;
  group: string;
  priority: string;
  viewport: string;
  viewportWidth: number;
  viewportHeight: number;
  engine: string;
  url: string;
  status: 'ok' | 'warn' | 'fail' | 'error';
  loadOk: boolean;
  horizontalScrollPx: number;
  overflowFindings: OverflowFinding[];
  smallTouchTargets: SmallTouchTarget[];
  drawerCheck: { mobileHeaderVisible: boolean; sidebarHidden: boolean; drawerOpens: boolean | null } | null;
  screenshot: string | null;
  notes: string[];
  errors: string[];
  source?: string;
}

const RESULTS_DIR = 'tests/mobile-audit/results';
const SHOTS_DIR = 'tests/mobile-audit/screenshots';

fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.mkdirSync(SHOTS_DIR, { recursive: true });

function slugify(s: string) {
  return s.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'root';
}

export const test = base.extend<{
  auditPage: (route: Route) => Promise<AuditResult>;
}>({
  auditPage: async ({ page }, use, testInfo) => {
    const projectMeta = (testInfo.project.metadata ?? {}) as {
      viewportName?: string;
      viewportWidth?: number;
      viewportHeight?: number;
      engine?: string;
    };
    const viewport = projectMeta.viewportName ?? testInfo.project.name;
    const viewportWidth = projectMeta.viewportWidth ?? page.viewportSize()?.width ?? 0;
    const viewportHeight = projectMeta.viewportHeight ?? page.viewportSize()?.height ?? 0;
    const engine = projectMeta.engine ?? 'chromium';

    const audit = async (route: Route): Promise<AuditResult> => {
      const errors: string[] = [];
      const notes: string[] = [];
      const screenshotName = `${slugify(route.path)}.png`;
      const screenshotPath = path.join(SHOTS_DIR, viewport, screenshotName);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console: ${msg.text().slice(0, 240)}`);
      });

      let loadOk = true;
      let url = '';
      try {
        const resp = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        url = page.url();
        if (resp && !resp.ok() && !route.expectError) {
          loadOk = false;
          errors.push(`HTTP ${resp.status()} on initial nav`);
        }
        // Best-effort settle: small idle window, capped.
        await page.waitForLoadState('networkidle', { timeout: 2_500 }).catch(() => {});
      } catch (e: unknown) {
        loadOk = false;
        errors.push(`nav: ${(e as Error).message.split('\n')[0]}`);
      }

      // Probe layout
      const probe = await page.evaluate(() => {
        const docEl = document.documentElement;
        const horizontalScrollPx = docEl.scrollWidth - docEl.clientWidth;
        const vw = window.innerWidth;

        const overflowFindings: Array<{
          selector: string;
          rect: { x: number; y: number; width: number; height: number };
          overflowPx: number;
          text: string;
          classes: string;
        }> = [];

        const all = document.body.querySelectorAll<HTMLElement>('*');
        const seenSelectors = new Set<string>();
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const overflow = rect.right - vw;
          if (overflow > 1) {
            // Build a short selector
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls = (el.className && typeof el.className === 'string')
              ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
              : '';
            const testid = el.getAttribute('data-testid');
            const sel = testid ? `[data-testid="${testid}"]` : `${tag}${id}${cls}`.slice(0, 200);
            if (seenSelectors.has(sel)) continue;
            seenSelectors.add(sel);
            overflowFindings.push({
              selector: sel,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              overflowPx: Math.round(overflow),
              text: (el.innerText || '').slice(0, 80).replace(/\s+/g, ' ').trim(),
              classes: typeof el.className === 'string' ? el.className.slice(0, 200) : '',
            });
            if (overflowFindings.length >= 25) break;
          }
        }

        // Touch targets
        const tapSelectors = 'button, a[href], [role="button"], input[type="checkbox"], input[type="radio"], [data-testid][onclick]';
        const tapEls = Array.from(document.querySelectorAll<HTMLElement>(tapSelectors));
        const smallTouchTargets: Array<{ selector: string; width: number; height: number; text: string }> = [];
        for (const el of tapEls) {
          // Skip hidden
          const cs = window.getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          // Skip inline links inside paragraph text
          if (el.tagName === 'A' && el.closest('p')) continue;
          const min = Math.min(rect.width, rect.height);
          if (min < 44) {
            const tag = el.tagName.toLowerCase();
            const cls = (el.className && typeof el.className === 'string')
              ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')
              : '';
            const testid = el.getAttribute('data-testid');
            const sel = testid ? `[data-testid="${testid}"]` : `${tag}${cls}`.slice(0, 160);
            smallTouchTargets.push({
              selector: sel,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 60).replace(/\s+/g, ' ').trim(),
            });
            if (smallTouchTargets.length >= 30) break;
          }
        }

        return { horizontalScrollPx: Math.round(horizontalScrollPx), overflowFindings, smallTouchTargets };
      }).catch((e) => {
        errors.push(`probe: ${(e as Error).message.split('\n')[0]}`);
        return { horizontalScrollPx: 0, overflowFindings: [], smallTouchTargets: [] };
      });

      // Drawer check (only at <1024px and authenticated routes)
      let drawerCheck: AuditResult['drawerCheck'] = null;
      if (route.auth === 'authed' && viewportWidth < 1024 && loadOk) {
        try {
          const sidebarLocator = page.locator('aside, [data-testid="sidebar"], nav[aria-label*="sidebar" i]').first();
          const headerLocator = page.locator('[data-testid="mobile-header"], header').first();
          const sidebarBox = await sidebarLocator.boundingBox().catch(() => null);
          const headerVisible = await headerLocator.isVisible().catch(() => false);
          // Sidebar should NOT take up content area at < lg (i.e. zero width or off-screen)
          const sidebarHidden = !sidebarBox || sidebarBox.x + sidebarBox.width <= 1 || sidebarBox.width < 1;
          drawerCheck = {
            mobileHeaderVisible: headerVisible,
            sidebarHidden,
            drawerOpens: null,
          };
        } catch (e) {
          notes.push(`drawer-check skipped: ${(e as Error).message.split('\n')[0]}`);
        }
      }

      // Screenshot
      let screenshot: string | null = null;
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
        screenshot = path.relative('tests/mobile-audit', screenshotPath);
      } catch (e) {
        notes.push(`screenshot: ${(e as Error).message.split('\n')[0]}`);
      }

      const status: AuditResult['status'] = !loadOk
        ? 'error'
        : (probe.horizontalScrollPx > 1 || probe.overflowFindings.length > 0)
        ? 'fail'
        : probe.smallTouchTargets.length > 0 || (drawerCheck && (!drawerCheck.mobileHeaderVisible || !drawerCheck.sidebarHidden))
        ? 'warn'
        : 'ok';

      const result: AuditResult = {
        route: route.path,
        group: route.group,
        priority: route.priority,
        viewport,
        viewportWidth,
        viewportHeight,
        engine,
        url,
        status,
        loadOk,
        horizontalScrollPx: probe.horizontalScrollPx,
        overflowFindings: probe.overflowFindings,
        smallTouchTargets: probe.smallTouchTargets,
        drawerCheck,
        screenshot,
        notes,
        errors,
        source: route.source,
      };

      // Write/append per-(viewport,route) JSON so concurrent specs don't clobber.
      const resultFile = path.join(RESULTS_DIR, `${viewport}__${slugify(route.path)}.json`);
      fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));

      // Also attach to the test report for convenience.
      await testInfo.attach(`audit-${route.path}`, {
        body: JSON.stringify(result, null, 2),
        contentType: 'application/json',
      });

      return result;
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture API, not the React `use` hook
    await use(audit);
  },
});

export { expect };
export type { Page, TestInfo };
