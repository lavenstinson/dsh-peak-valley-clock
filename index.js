/** Host half: serves the two avatar images from the 图片素材 folder next to this package. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 客户端通过 /pvc-assets/<slug> 访问；slug 只映射这两个文件，杜绝路径穿越。
// 图片放在插件目录同级的 图片素材/ 下；没有这些文件时头像自动回退为内置占位图。
const ASSETS = {
  'dafeiyu.png': new URL('../图片素材/大肥鱼.png', import.meta.url),
  'liangsheng.png': new URL('../图片素材/梁圣.png', import.meta.url),
};

export const inject = ['webServer'];

export function apply(ctx) {
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
}
