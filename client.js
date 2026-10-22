window.__ModuleLoader__.load({
  id: 'dsh-peak-valley-usage',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // ---------------------------------------------------------------------
    // DeepSeek API 峰谷计价时段（官方定价规则，北京时间）
    // 峰时：周一至周五（不含中国法定节假日）09:00–12:00、14:00–18:00 → 大肥鱼
    // 谷时：其余所有时间（含周末、节假日全天）→ 梁圣
    // ---------------------------------------------------------------------
    const PEAK_WINDOWS = [
      { start: 9 * 60, end: 12 * 60 },
      { start: 14 * 60, end: 18 * 60 },
    ];
    const HOLIDAYS = new Set(['2027-01-01']); // 元旦；更多节假日自行添加
    const PERIODS = {
      peak: { label: '峰', name: '大肥鱼', img: '/pvc-assets/dafeiyu.png', range: '工作日 09:00–12:00 / 14:00–18:00' },
      valley: { label: '谷', name: '梁圣', img: '/pvc-assets/liangsheng.png', range: '其余时间及周末、节假日全天' },
    };
    const AVATAR_SIZE = 36; // 45px × 0.8

    const pad = (n) => String(n).padStart(2, '0');

    function periodFor(date) {
      const day = date.getDay(); // 0=周日 6=周六
      if (day === 0 || day === 6) return 'valley';
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      if (HOLIDAYS.has(key)) return 'valley';
      const mins = date.getHours() * 60 + date.getMinutes();
      return PEAK_WINDOWS.some((w) => mins >= w.start && mins < w.end) ? 'peak' : 'valley';
    }

    // --- 图片加载失败时的占位头像（峰：暖色 / 谷：青色） ---
    function PlaceholderAvatar({ kind, size }) {
      const warm = kind === 'peak';
      return h('svg', {
        viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': true,
      },
        h('circle', { cx: 32, cy: 32, r: 32, fill: warm ? '#f97316' : '#0ea5e9' }),
        h('circle', { cx: 32, cy: 25, r: 13, fill: '#fff1e6' }),
        h('path', { d: 'M19 22a13 13 0 0 1 26 0l-1-6c-2-5-5-8-12-8s-10 3-12 8z', fill: '#1f2937' }),
        h('path', { d: 'M13 64c0-13 8-19 19-19s19 6 19 19z', fill: warm ? '#c2410c' : '#0369a1' }),
        h('circle', { cx: 27, cy: 26, r: 1.8, fill: '#1f2937' }),
        h('circle', { cx: 37, cy: 26, r: 1.8, fill: '#1f2937' }),
        h('path', { d: 'M27 32c2 2.4 8 2.4 10 0', stroke: '#7c2d12', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' }),
      );
    }

    function Avatar({ src, kind, size }) {
      const [failed, setFailed] = React.useState(false);
      React.useEffect(() => setFailed(false), [src]);
      if (failed) return h(PlaceholderAvatar, { kind, size });
      return h('img', {
        className: 'pvc-avatar',
        src,
        width: size,
        height: size,
        alt: '',
        draggable: false,
        onError: () => setFailed(true),
      });
    }

    // --- 数字格式化 ---
    function formatTokens(n) {
      if (typeof n !== 'number' || !isFinite(n)) return '--';
      if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿`;
      if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
      return n.toLocaleString('zh-CN');
    }

    function formatBalance(balance) {
      if (balance === null || balance === undefined) return '--';
      if (balance.status === 'ok') {
        const wallets = balance.wallets || [];
        if (wallets.length === 0) return '¥0.00';
        return wallets.map((w) => {
          const n = Number(w.balance);
          const text = isFinite(n) ? n.toFixed(2) : String(w.balance);
          return `${w.currency === 'USD' ? '$' : '¥'}${text}`;
        }).join(' / ');
      }
      if (balance.status === 'signed-out') return '未登录';
      return '获取失败';
    }

    const CSS = `
.pvc-strip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 0 8px;
  white-space: nowrap;
}
.pvc-avatar {
  display: block;
  flex: none;
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), 0 1px 4px rgba(0, 0, 0, 0.35);
}
.pvc-strip > svg {
  display: block;
  flex: none;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), 0 1px 4px rgba(0, 0, 0, 0.35);
}
.pvc-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  line-height: 1.15;
}
.pvc-line {
  color: #ffffff;
  font-size: 12.8px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
}
.pvc-label {
  color: rgba(255, 255, 255, 0.62);
  font-weight: 500;
  margin-right: 4px;
}
`;

    function UsageStrip() {
      const [now, setNow] = React.useState(() => new Date());
      const [status, setStatus] = React.useState(null);

      // 每 30 秒刷新一次峰谷判定（跨时段边界及时切换头像）
      React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
      }, []);

      // 用量与余额：首屏立即拉取，之后每 60 秒刷新（Host 端有 60 秒缓存）
      React.useEffect(() => {
        let alive = true;
        const load = async () => {
          try {
            const res = await fetch('/pvc-usage', { cache: 'no-store' });
            const json = await res.json();
            if (alive) setStatus(json);
          } catch {
            if (alive) setStatus((prev) => prev ?? { tokens: null, balance: null });
          }
        };
        load();
        const timer = setInterval(load, 60_000);
        return () => {
          alive = false;
          clearInterval(timer);
        };
      }, []);

      const period = periodFor(now);
      const info = PERIODS[period];
      const tokenText = status === null ? '--' : formatTokens(status.tokens ? status.tokens.total : null);
      const balanceText = status === null ? '--' : formatBalance(status.balance);

      return h('div', {
        className: 'pvc-strip',
      },
        h('style', null, CSS),
        h(Avatar, { src: info.img, kind: period, size: AVATAR_SIZE }),
        h('div', { className: 'pvc-info' },
          h('span', { className: 'pvc-line' },
            h('span', { className: 'pvc-label' }, '今日 Token'),
            tokenText,
          ),
          h('span', { className: 'pvc-line' },
            h('span', { className: 'pvc-label' }, '余额'),
            balanceText,
          ),
        ),
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
          name: 'conversation.header.leading',
        }, UsageStrip));
      },
    };
  },
});
