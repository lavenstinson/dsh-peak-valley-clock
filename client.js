window.__ModuleLoader__.load({
  id: 'dsh-peak-valley-clock',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // ---------------------------------------------------------------------
    // DeepSeek API 峰谷计价时段（官方定价规则，北京时间）
    // 峰时：周一至周五（不含中国法定节假日）09:00–12:00、14:00–18:00 → 大肥鱼
    // 谷时：其余所有时间（含周末、节假日全天）→ 梁圣
    // HOLIDAYS 里放「工作日放假」的日期（YYYY-MM-DD）即可，周末本来就全谷。
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

    const CSS = `
.pvc-strip {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  white-space: nowrap;
  pointer-events: auto;
}
.pvc-avatar {
  display: block;
  flex: none;
  width: 30px;
  height: 30px;
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
.pvc-time {
  color: #ffffff;
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 31px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
}
.pvc-badge {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.pvc-peak {
  color: var(--dsw-alias-state-warn-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 55%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent);
}
.pvc-valley {
  color: var(--dsw-alias-state-success-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 55%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent);
}
`;

    function ClockStrip() {
      const [now, setNow] = React.useState(() => new Date());

      React.useEffect(() => {
        let timer;
        const tick = () => {
          setNow(new Date());
          timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
        };
        timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
        return () => clearTimeout(timer);
      }, []);

      const period = periodFor(now);
      const info = PERIODS[period];
      const isPeak = period === 'peak';
      const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      return h('div', {
        className: 'pvc-strip',
        role: 'status',
        'aria-label': `${timeText}，${info.name}，${info.label}时段`,
        title: `${info.name} · ${info.label}时段（${info.range}）`,
      },
        h('style', null, CSS),
        h(Avatar, { src: info.img, kind: period, size: 30 }),
        h('span', { className: 'pvc-time' }, timeText),
        h('span', { className: isPeak ? 'pvc-badge pvc-peak' : 'pvc-badge pvc-valley' }, info.label),
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
          name: 'conversation.header.leading',
        }, ClockStrip));
      },
    };
  },
});
