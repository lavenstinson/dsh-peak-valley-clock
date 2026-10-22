/** Host half: serves avatar images and the usage snapshot (today's tokens + account balance). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 客户端通过 /pvc-assets/<slug> 访问；slug 只映射这两个文件，杜绝路径穿越。
// 图片放在插件目录同级的 图片素材/ 下；没有这些文件时头像自动回退为内置占位图。
const ASSETS = {
  'dafeiyu.png': new URL('../图片素材/大肥鱼.png', import.meta.url),
  'liangsheng.png': new URL('../图片素材/梁圣.png', import.meta.url),
};

export const inject = ['webServer'];

const CACHE_MS = 60_000;

/** @returns {number} local midnight of the current day (epoch ms) */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Sum today's assistant usage across sessions active today.
 * @param {any} ctx plugin context
 */
async function readTodayTokens(ctx) {
  const sessionController = ctx.get('sessionController');
  const sessionQuery = ctx.get('sessionQuery');
  if (sessionController === undefined || sessionQuery === undefined) return null;
  const todayStart = startOfToday();
  const list = await sessionController.list({}, AbortSignal.timeout(15_000));
  const ids = list.items
    .filter((item) => item.updatedAt >= todayStart)
    .slice(0, 30)
    .map((item) => item.sessionId);
  const totals = { input: 0, output: 0, total: 0, cacheRead: 0, cacheWrite: 0 };
  for (const id of ids) {
    const snapshot = await sessionQuery.readSession(id);
    for (const event of snapshot.events) {
      if (event.type !== 'assistant/message' || event.time < todayStart) continue;
      const usage = event.data && event.data.usage;
      if (!usage) continue;
      totals.input += usage.inputTokens || 0;
      totals.output += usage.outputTokens || 0;
      totals.cacheRead += usage.cacheReadTokens || 0;
      totals.cacheWrite += usage.cacheWriteTokens || 0;
    }
  }
  totals.total = totals.input + totals.output;
  return totals;
}

/** @param {any} ctx plugin context */
async function readBalance(ctx) {
  const account = ctx.get('deepseekAccount');
  if (account === undefined) return { status: 'unavailable' };
  try {
    const result = await account.getBalance({
      version: '1.0.0',
      locale: 'zh-CN',
      timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
    });
    if (result === null || result === undefined) return { status: 'signed-out' };
    if (result.status === 'ready') {
      return { status: 'ok', wallets: result.value, bonusWallets: result.bonusWallets };
    }
    return { status: 'failed' };
  } catch (error) {
    return { status: 'error', message: String((error && error.message) || error) };
  }
}

export function apply(ctx) {
  /** @type {{ at: number, value: unknown } | null} */
  let cache = null;

  async function snapshot() {
    const now = Date.now();
    if (cache !== null && now - cache.at < CACHE_MS) return cache.value;
    const value = { time: now, tokens: null, balance: null };
    try {
      value.tokens = await readTodayTokens(ctx);
    } catch (error) {
      value.tokensError = String((error && error.message) || error);
    }
    try {
      value.balance = await readBalance(ctx);
    } catch (error) {
      value.balance = { status: 'error', message: String((error && error.message) || error) };
    }
    cache = { at: now, value };
    return value;
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/pvc-assets',
    handler(req, res) {
      const pathname = new URL(req.url ?? '/', 'http://x').pathname;
      const name = pathname.slice('/pvc-assets/'.length);
      const file = ASSETS[name];
      if (file === undefined) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      try {
        const data = readFileSync(fileURLToPath(file));
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': data.length,
          'Cache-Control': 'no-cache',
        });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    },
  }));

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/pvc-usage',
    handler: async (req, res) => {
      if ((req.method || 'GET').toUpperCase() !== 'GET') {
        res.writeHead(405);
        res.end();
        return;
      }
      try {
        const value = await snapshot();
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify(value));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: String((error && error.message) || error) }));
      }
    },
  }));
}
