import fs from 'node:fs';
import path from 'node:path';
import type { AuditResult } from '../fixtures';

const RESULTS_DIR = 'tests/mobile-audit/results';
const REPORT_PATH = 'tests/mobile-audit/report/REPORT.md';

function readResults(): AuditResult[] {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  return fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')) as AuditResult);
}

function pct(n: number, d: number) {
  if (d === 0) return '0%';
  return `${Math.round((n / d) * 100)}%`;
}

function relScreenshot(p: string | null) {
  if (!p) return '—';
  return `[png](../${p})`;
}

function summary(results: AuditResult[]) {
  const byViewport = new Map<string, { ok: number; warn: number; fail: number; error: number; total: number }>();
  const byPriority = new Map<string, { ok: number; warn: number; fail: number; error: number; total: number }>();
  for (const r of results) {
    for (const map of [byViewport, byPriority]) {
      const key = map === byViewport ? r.viewport : r.priority;
      const cur = map.get(key) ?? { ok: 0, warn: 0, fail: 0, error: 0, total: 0 };
      cur[r.status]++;
      cur.total++;
      map.set(key, cur);
    }
  }
  return { byViewport, byPriority };
}

function fmtTable(rows: Array<Record<string, string | number>>, headers: string[]) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];
  for (const r of rows) {
    lines.push(`| ${headers.map((h) => String(r[h] ?? '')).join(' | ')} |`);
  }
  return lines.join('\n');
}

function findingsByPriority(results: AuditResult[], priority: string) {
  return results
    .filter((r) => r.priority === priority && (r.status === 'fail' || r.status === 'error'))
    .sort((a, b) => a.route.localeCompare(b.route) || a.viewport.localeCompare(b.viewport));
}

function crossCutting(results: AuditResult[]) {
  // Group overflow selectors that appear across many routes.
  const counts = new Map<string, { count: number; routes: Set<string> }>();
  for (const r of results) {
    for (const f of r.overflowFindings) {
      const key = f.selector;
      const cur = counts.get(key) ?? { count: 0, routes: new Set() };
      cur.count++;
      cur.routes.add(r.route);
      counts.set(key, cur);
    }
  }
  return Array.from(counts.entries())
    .filter(([, v]) => v.routes.size >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);
}

function build() {
  const results = readResults();
  if (results.length === 0) {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, '# Mobile Audit Report\n\n_No results found. Run `npm run audit:mobile` first._\n');
    console.log(`Wrote empty report to ${REPORT_PATH}`);
    return;
  }

  const { byViewport, byPriority } = summary(results);

  const lines: string[] = [];
  lines.push('# Mobile Responsiveness Audit — app.zenible.com');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString()} from ${results.length} (route × viewport) probes.`);
  lines.push('');
  lines.push('## Summary by viewport');
  lines.push('');
  lines.push(
    fmtTable(
      Array.from(byViewport.entries()).map(([viewport, s]) => ({
        viewport,
        ok: s.ok,
        warn: s.warn,
        fail: s.fail,
        error: s.error,
        total: s.total,
        '% pass': pct(s.ok, s.total),
      })),
      ['viewport', 'ok', 'warn', 'fail', 'error', 'total', '% pass'],
    ),
  );
  lines.push('');
  lines.push('## Summary by priority');
  lines.push('');
  lines.push(
    fmtTable(
      Array.from(byPriority.entries()).map(([priority, s]) => ({
        priority,
        ok: s.ok,
        warn: s.warn,
        fail: s.fail,
        error: s.error,
        total: s.total,
        '% pass': pct(s.ok, s.total),
      })),
      ['priority', 'ok', 'warn', 'fail', 'error', 'total', '% pass'],
    ),
  );
  lines.push('');

  for (const priority of ['P0', 'P1', 'P2'] as const) {
    const findings = findingsByPriority(results, priority);
    lines.push(`## ${priority} findings (${findings.length})`);
    lines.push('');
    if (findings.length === 0) {
      lines.push('_None._');
      lines.push('');
      continue;
    }
    // Group by route, then list per viewport.
    const byRoute = new Map<string, AuditResult[]>();
    for (const f of findings) {
      const arr = byRoute.get(f.route) ?? [];
      arr.push(f);
      byRoute.set(f.route, arr);
    }
    for (const [route, rows] of byRoute) {
      const first = rows[0];
      lines.push(`### \`${route}\` (${first.group})`);
      if (first.source) lines.push(`Source hint: \`${first.source}\``);
      lines.push('');
      lines.push(
        fmtTable(
          rows.map((r) => ({
            viewport: `${r.viewport} (${r.viewportWidth})`,
            engine: r.engine,
            status: r.status,
            'h-scroll px': r.horizontalScrollPx,
            'overflow elems': r.overflowFindings.length,
            'small targets': r.smallTouchTargets.length,
            screenshot: relScreenshot(r.screenshot),
          })),
          ['viewport', 'engine', 'status', 'h-scroll px', 'overflow elems', 'small targets', 'screenshot'],
        ),
      );
      lines.push('');
      // Top 3 overflow selectors across all rows
      const sels = new Map<string, { count: number; sample: typeof first.overflowFindings[number] }>();
      for (const r of rows) {
        for (const o of r.overflowFindings) {
          const cur = sels.get(o.selector) ?? { count: 0, sample: o };
          cur.count++;
          sels.set(o.selector, cur);
        }
      }
      const topSels = Array.from(sels.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
      if (topSels.length > 0) {
        lines.push('**Top overflowing selectors:**');
        for (const [sel, info] of topSels) {
          lines.push(`- \`${sel}\` × ${info.count} — overflow ${info.sample.overflowPx}px — text: "${info.sample.text}"`);
        }
        lines.push('');
      }
    }
  }

  // Touch-target violations
  const touchByRoute = new Map<string, number>();
  for (const r of results) {
    if (r.smallTouchTargets.length > 0) {
      touchByRoute.set(r.route, (touchByRoute.get(r.route) ?? 0) + r.smallTouchTargets.length);
    }
  }
  lines.push('## Touch-target violations (<44px)');
  lines.push('');
  if (touchByRoute.size === 0) {
    lines.push('_None._');
  } else {
    lines.push(
      fmtTable(
        Array.from(touchByRoute.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([route, count]) => ({ route, 'violations (sum across viewports)': count })),
        ['route', 'violations (sum across viewports)'],
      ),
    );
  }
  lines.push('');

  // Cross-cutting
  lines.push('## Cross-cutting overflow patterns');
  lines.push('');
  const xc = crossCutting(results);
  if (xc.length === 0) {
    lines.push('_None spanning ≥3 routes._');
  } else {
    lines.push(
      fmtTable(
        xc.map(([sel, info]) => ({
          selector: `\`${sel.slice(0, 80)}\``,
          'occurrences': info.count,
          'distinct routes': info.routes.size,
        })),
        ['selector', 'occurrences', 'distinct routes'],
      ),
    );
  }
  lines.push('');

  // Errors
  const errored = results.filter((r) => r.status === 'error' || r.errors.length > 0);
  if (errored.length > 0) {
    lines.push('## Routes with load/runtime errors');
    lines.push('');
    lines.push(
      fmtTable(
        errored.slice(0, 60).map((r) => ({
          route: r.route,
          viewport: r.viewport,
          'first error': r.errors[0]?.slice(0, 160) ?? '',
        })),
        ['route', 'viewport', 'first error'],
      ),
    );
    lines.push('');
  }

  lines.push('## Out of scope');
  lines.push('');
  lines.push('- `/admin/*` (demo account is not admin)');
  lines.push('- Stripe / Google OAuth callback routes');
  lines.push('- Real-data mutation flows (creating invoices, sending emails)');
  lines.push('- Performance metrics (Lighthouse) — separate pass');
  lines.push('');

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join('\n'));
  console.log(`Wrote report to ${REPORT_PATH}`);
}

build();
