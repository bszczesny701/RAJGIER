import { useEffect, useRef, type MutableRefObject, type PointerEvent as ReactPointerEvent } from 'react';

export interface FieldUnit {
  id: string;
  avatar: string;
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  flying: boolean;
  anim: string;
  attackAnim: number;
  hitFlash: number;
  facing: number;
}

export interface FieldTower {
  id: string;
  type: 'king' | 'princess';
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  attackAnim?: number;
}

export interface FieldProjectile {
  id: string;
  style: string;
  x: number;
  y: number;
  angle: number;
}

export interface FieldEffect {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  tx?: number;
  ty?: number;
}

export interface FieldSnapshot {
  arenaW: number;
  arenaH: number;
  units: FieldUnit[];
  towers: FieldTower[];
  projectiles: FieldProjectile[];
  effects: FieldEffect[];
}

const THUMB_SRC: Record<string, string> = {
  knight: '/arena/thumbs/knight.jpg',
  goblin: '/arena/thumbs/goblin.jpg',
  archer: '/arena/thumbs/archer.jpg',
  giant: '/arena/thumbs/giant.jpg',
  wizard: '/arena/thumbs/wizard.jpg',
  dragon: '/arena/thumbs/dragon.jpg',
  tower: '/arena/thumbs/tower.jpg',
  fireball: '/arena/thumbs/fireball.jpg',
};

const images = new Map<string, HTMLImageElement>();

function ensureImages() {
  if (images.size) return;
  for (const [key, src] of Object.entries(THUMB_SRC)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    images.set(key, img);
  }
}

function imgOf(avatar: string) {
  return images.get(avatar) || images.get('knight') || null;
}

/** Arena (x right, y up from own king) → canvas pixels (y down). */
function toPx(x: number, y: number, aw: number, ah: number, w: number, h: number) {
  return {
    px: (x / aw) * w,
    py: ((ah - y) / ah) * h,
  };
}

type SmoothUnit = {
  id: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  avatar: string;
  mine: boolean;
  hp: number;
  maxHp: number;
  flying: boolean;
  anim: string;
  attackAnim: number;
  hitFlash: number;
  facing: number;
};

type SmoothTower = FieldTower & { sx: number; sy: number };

interface ArenaFieldCanvasProps {
  stateRef: MutableRefObject<FieldSnapshot | null>;
  targeting?: boolean;
  onDeploy?: (arenaX: number, arenaY: number) => void;
}

export default function ArenaFieldCanvas({ stateRef, targeting, onDeploy }: ArenaFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onDeployRef = useRef(onDeploy);
  onDeployRef.current = onDeploy;

  const smoothUnits = useRef(new Map<string, SmoothUnit>());
  const smoothTowers = useRef(new Map<string, SmoothTower>());
  const bgCache = useRef<HTMLCanvasElement | null>(null);
  const bgKey = useRef('');

  useEffect(() => {
    ensureImages();
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let lastT = performance.now();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgCache.current = null;
      bgKey.current = '';
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const buildBg = (aw: number, ah: number, w: number, h: number) => {
      const key = `${aw}x${ah}:${w}x${h}`;
      if (bgCache.current && bgKey.current === key) return bgCache.current;
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const g = off.getContext('2d')!;
      // grass halves
      const riverY = (1 - 0.5) * h;
      const riverHalf = (0.85 / ah) * h;
      const gradTop = g.createLinearGradient(0, 0, 0, riverY - riverHalf);
      gradTop.addColorStop(0, '#14532d');
      gradTop.addColorStop(1, '#166534');
      g.fillStyle = gradTop;
      g.fillRect(0, 0, w, riverY - riverHalf);

      const gradBot = g.createLinearGradient(0, riverY + riverHalf, 0, h);
      gradBot.addColorStop(0, '#15803d');
      gradBot.addColorStop(1, '#166534');
      g.fillStyle = gradBot;
      g.fillRect(0, riverY + riverHalf, w, h - (riverY + riverHalf));

      // river
      const riverGrad = g.createLinearGradient(0, riverY - riverHalf, 0, riverY + riverHalf);
      riverGrad.addColorStop(0, '#1e40af');
      riverGrad.addColorStop(0.5, '#3b82f6');
      riverGrad.addColorStop(1, '#1e40af');
      g.fillStyle = riverGrad;
      g.fillRect(0, riverY - riverHalf, w, riverHalf * 2);

      // banks
      g.fillStyle = '#14532d';
      g.fillRect(0, riverY - riverHalf - 3, w, 3);
      g.fillRect(0, riverY + riverHalf, w, 3);

      // bridges
      for (const bx of [0.25, 0.75]) {
        const cx = bx * w;
        const bw = (1.35 * 2 / aw) * w;
        g.fillStyle = '#a16207';
        g.fillRect(cx - bw / 2, riverY - riverHalf - 4, bw, riverHalf * 2 + 8);
        g.fillStyle = '#78350f';
        g.fillRect(cx - bw / 2, riverY - riverHalf - 4, 4, riverHalf * 2 + 8);
        g.fillRect(cx + bw / 2 - 4, riverY - riverHalf - 4, 4, riverHalf * 2 + 8);
        // planks
        g.strokeStyle = 'rgba(0,0,0,0.25)';
        g.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const py = riverY - riverHalf + (i + 1) * ((riverHalf * 2) / 6);
          g.beginPath();
          g.moveTo(cx - bw / 2 + 4, py);
          g.lineTo(cx + bw / 2 - 4, py);
          g.stroke();
        }
      }

      // lane marks
      g.strokeStyle = 'rgba(255,255,255,0.07)';
      g.lineWidth = 2;
      g.setLineDash([8, 10]);
      g.beginPath();
      g.moveTo(w * 0.5, 8);
      g.lineTo(w * 0.5, h - 8);
      g.stroke();
      g.setLineDash([]);

      bgCache.current = off;
      bgKey.current = key;
      return off;
    };

    const drawTower = (
      g: CanvasRenderingContext2D,
      t: SmoothTower,
      aw: number,
      ah: number,
      w: number,
      h: number,
    ) => {
      const { px, py } = toPx(t.sx, t.sy, aw, ah, w, h);
      const ally = t.mine;
      const body = ally ? '#d6d3d1' : '#9f1239';
      const accent = ally ? '#38bdf8' : '#f43f5e';

      if (!t.alive) {
        if (t.type === 'king') return;
        g.fillStyle = '#292524';
        g.fillRect(px - 18, py - 8, 36, 14);
        return;
      }

      if (t.type === 'king') {
        const s = Math.min(w, h) * 0.055;
        // base
        g.fillStyle = '#44403c';
        roundRect(g, px - s * 1.1, py - s * 0.2, s * 2.2, s * 0.55, 4);
        g.fill();
        // body
        g.fillStyle = body;
        roundRect(g, px - s * 0.85, py - s * 1.7, s * 1.7, s * 1.55, 3);
        g.fill();
        // accent stripe
        g.fillStyle = accent;
        g.fillRect(px - s * 0.7, py - s * 0.9, s * 1.4, s * 0.18);
        // battlements
        g.fillStyle = '#57534e';
        for (let i = -2; i <= 2; i++) {
          g.fillRect(px + i * s * 0.35 - s * 0.12, py - s * 1.95, s * 0.22, s * 0.28);
        }
        // crown
        g.fillStyle = '#fbbf24';
        g.beginPath();
        g.moveTo(px - s * 0.35, py - s * 1.95);
        g.lineTo(px - s * 0.2, py - s * 2.35);
        g.lineTo(px, py - s * 2.1);
        g.lineTo(px + s * 0.2, py - s * 2.35);
        g.lineTo(px + s * 0.35, py - s * 1.95);
        g.closePath();
        g.fill();
        // flag
        g.strokeStyle = '#78716c';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(px + s * 0.7, py - s * 2.0);
        g.lineTo(px + s * 0.7, py - s * 2.55);
        g.stroke();
        g.fillStyle = '#ef4444';
        g.beginPath();
        g.moveTo(px + s * 0.7, py - s * 2.55);
        g.lineTo(px + s * 1.15, py - s * 2.35);
        g.lineTo(px + s * 0.7, py - s * 2.15);
        g.closePath();
        g.fill();
        // cannon
        g.fillStyle = (t.attackAnim || 0) > 0 ? '#fbbf24' : '#1c1917';
        g.fillRect(px - s * 0.15, py - s * 1.15, s * 0.3, s * 0.35);
      } else {
        const s = Math.min(w, h) * 0.042;
        g.fillStyle = '#44403c';
        roundRect(g, px - s * 0.85, py - s * 0.15, s * 1.7, s * 0.4, 3);
        g.fill();
        g.fillStyle = body;
        roundRect(g, px - s * 0.5, py - s * 1.55, s, s * 1.45, 2);
        g.fill();
        g.fillStyle = '#a16207';
        g.fillRect(px - s * 0.55, py - s * 0.85, s * 1.1, s * 0.14);
        g.fillStyle = accent;
        g.fillRect(px - s * 0.35, py - s * 1.1, s * 0.7, s * 0.12);
        g.fillStyle = '#44403c';
        roundRect(g, px - s * 0.7, py - s * 1.75, s * 1.4, s * 0.28, 2);
        g.fill();
        // archer
        g.fillStyle = '#0e7490';
        g.fillRect(px - s * 0.22, py - s * 2.05, s * 0.44, s * 0.35);
        g.fillStyle = '#fde68a';
        g.beginPath();
        g.arc(px, py - s * 2.15, s * 0.2, 0, Math.PI * 2);
        g.fill();
        if ((t.attackAnim || 0) > 0) {
          g.strokeStyle = '#fef3c7';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(px, py - s * 1.9);
          g.lineTo(px, py - s * 2.6);
          g.stroke();
        }
      }

      // HP bar
      if (t.alive && t.hp < t.maxHp) {
        drawHp(g, px, py - (t.type === 'king' ? Math.min(w, h) * 0.14 : Math.min(w, h) * 0.11), t.hp, t.maxHp, ally, 36);
      } else if (t.alive) {
        drawHp(g, px, py - (t.type === 'king' ? Math.min(w, h) * 0.14 : Math.min(w, h) * 0.11), t.hp, t.maxHp, ally, 36);
      }
    };

    const drawUnit = (
      g: CanvasRenderingContext2D,
      u: SmoothUnit,
      aw: number,
      ah: number,
      w: number,
      h: number,
      time: number,
    ) => {
      const { px, py } = toPx(u.sx, u.sy, aw, ah, w, h);
      const base = Math.min(w, h);
      let size = base * (u.avatar === 'giant' ? 0.11 : u.avatar === 'dragon' ? 0.1 : 0.085);
      if (u.hitFlash > 0) size *= 1.06;

      const bob =
        u.anim === 'walk'
          ? Math.sin(time * 0.012 + u.sx) * 2
          : u.flying
            ? Math.sin(time * 0.005) * 3
            : Math.sin(time * 0.003 + u.sy) * 1;
      const flyLift = u.flying ? base * 0.02 : 0;
      const cy = py - size * 0.35 + bob - flyLift;

      // shadow
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.beginPath();
      g.ellipse(px, py + 2, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
      g.fill();

      // team ring
      g.strokeStyle = u.mine ? 'rgba(56,189,248,0.85)' : 'rgba(244,63,94,0.85)';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(px, py + 2, size * 0.42, size * 0.14, 0, 0, Math.PI * 2);
      g.stroke();

      const im = imgOf(u.avatar);
      g.save();
      if (u.facing < 0) {
        g.translate(px, cy);
        g.scale(-1, 1);
        g.translate(-px, -cy);
      }
      if (u.attackAnim > 0) {
        g.translate(px, cy);
        g.rotate(Math.sin(time * 0.02) * 0.08);
        g.translate(-px, -cy);
      }
      if (im && im.complete && im.naturalWidth > 0) {
        // circular clip sprite
        g.beginPath();
        g.arc(px, cy, size * 0.48, 0, Math.PI * 2);
        g.closePath();
        g.clip();
        g.drawImage(im, px - size * 0.5, cy - size * 0.5, size, size);
      } else {
        g.fillStyle = u.mine ? '#38bdf8' : '#f43f5e';
        g.beginPath();
        g.arc(px, cy, size * 0.4, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();

      if (u.hitFlash > 0) {
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.beginPath();
        g.arc(px, cy, size * 0.48, 0, Math.PI * 2);
        g.fill();
      }

      drawHp(g, px, cy - size * 0.55, u.hp, u.maxHp, u.mine, Math.max(22, size * 0.7));
    };

    const drawProjectile = (
      g: CanvasRenderingContext2D,
      p: FieldProjectile,
      aw: number,
      ah: number,
      w: number,
      h: number,
    ) => {
      const { px, py } = toPx(p.x, p.y, aw, ah, w, h);
      if (p.style === 'arrow') {
        g.save();
        g.translate(px, py);
        g.rotate(-p.angle);
        g.strokeStyle = '#fef3c7';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(-6, 0);
        g.lineTo(8, 0);
        g.stroke();
        g.fillStyle = '#fbbf24';
        g.beginPath();
        g.moveTo(8, 0);
        g.lineTo(3, -3);
        g.lineTo(3, 3);
        g.closePath();
        g.fill();
        g.restore();
      } else if (p.style === 'fire' || p.style === 'fireball') {
        g.fillStyle = '#f97316';
        g.beginPath();
        g.arc(px, py, 7, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#fef08a';
        g.beginPath();
        g.arc(px - 1, py - 1, 3, 0, Math.PI * 2);
        g.fill();
      } else if (p.style === 'cannon') {
        g.fillStyle = '#57534e';
        g.beginPath();
        g.arc(px, py, 5, 0, Math.PI * 2);
        g.fill();
      } else {
        g.fillStyle = '#c084fc';
        g.beginPath();
        g.arc(px, py, 6, 0, Math.PI * 2);
        g.fill();
      }
    };

    const drawEffect = (
      g: CanvasRenderingContext2D,
      e: FieldEffect,
      aw: number,
      ah: number,
      w: number,
      h: number,
    ) => {
      const { px, py } = toPx(e.x, e.y, aw, ah, w, h);
      const alpha = Math.min(0.55, e.ttl);
      if (e.type === 'dragon-breath' && e.tx != null && e.ty != null) {
        const tip = toPx(e.tx, e.ty, aw, ah, w, h);
        g.strokeStyle = `rgba(249,115,22,${alpha})`;
        g.lineWidth = 10;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(tip.px, tip.py);
        g.stroke();
        return;
      }
      const r = (e.radius / aw) * w;
      g.fillStyle = e.type.includes('fire')
        ? `rgba(249,115,22,${alpha})`
        : `rgba(226,232,240,${alpha * 0.7})`;
      g.beginPath();
      g.arc(px, py, r, 0, Math.PI * 2);
      g.fill();
    };

    const syncSmooth = (snap: FieldSnapshot) => {
      const seenU = new Set<string>();
      for (const u of snap.units) {
        seenU.add(u.id);
        const prev = smoothUnits.current.get(u.id);
        if (prev) {
          prev.tx = u.x;
          prev.ty = u.y;
          prev.avatar = u.avatar;
          prev.mine = u.mine;
          prev.hp = u.hp;
          prev.maxHp = u.maxHp;
          prev.flying = u.flying;
          prev.anim = u.anim;
          prev.attackAnim = u.attackAnim;
          prev.hitFlash = u.hitFlash;
          prev.facing = u.facing;
        } else {
          smoothUnits.current.set(u.id, {
            id: u.id,
            sx: u.x,
            sy: u.y,
            tx: u.x,
            ty: u.y,
            avatar: u.avatar,
            mine: u.mine,
            hp: u.hp,
            maxHp: u.maxHp,
            flying: u.flying,
            anim: u.anim,
            attackAnim: u.attackAnim,
            hitFlash: u.hitFlash,
            facing: u.facing,
          });
        }
      }
      for (const id of [...smoothUnits.current.keys()]) {
        if (!seenU.has(id)) smoothUnits.current.delete(id);
      }

      const seenT = new Set<string>();
      for (const t of snap.towers) {
        seenT.add(t.id);
        const prev = smoothTowers.current.get(t.id);
        if (prev) {
          Object.assign(prev, t);
          prev.sx = t.x;
          prev.sy = t.y;
        } else {
          smoothTowers.current.set(t.id, { ...t, sx: t.x, sy: t.y });
        }
      }
      for (const id of [...smoothTowers.current.keys()]) {
        if (!seenT.has(id)) smoothTowers.current.delete(id);
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      const snap = stateRef.current;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (!snap || cssW < 2 || cssH < 2) {
        ctx.fillStyle = '#0a1f12';
        ctx.fillRect(0, 0, cssW, cssH);
        return;
      }

      syncSmooth(snap);
      const lerp = 1 - Math.exp(-14 * dt);
      for (const u of smoothUnits.current.values()) {
        u.sx += (u.tx - u.sx) * lerp;
        u.sy += (u.ty - u.sy) * lerp;
      }

      const aw = snap.arenaW || 18;
      const ah = snap.arenaH || 32;
      const bg = buildBg(aw, ah, cssW, cssH);
      ctx.drawImage(bg, 0, 0);

      // draw order: far → near (higher arena y first)
      const towers = [...smoothTowers.current.values()].sort((a, b) => b.sy - a.sy);
      for (const t of towers) drawTower(ctx, t, aw, ah, cssW, cssH);

      for (const e of snap.effects) drawEffect(ctx, e, aw, ah, cssW, cssH);

      const units = [...smoothUnits.current.values()].sort((a, b) => b.sy - a.sy);
      for (const u of units) drawUnit(ctx, u, aw, ah, cssW, cssH, now);

      for (const p of snap.projectiles) drawProjectile(ctx, p, aw, ah, cssW, cssH);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [stateRef]);

  const onPointer = (ev: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!targeting || !onDeployRef.current) return;
    const canvas = canvasRef.current;
    const snap = stateRef.current;
    if (!canvas || !snap) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (ev.clientX - rect.left) / rect.width;
    const ny = (ev.clientY - rect.top) / rect.height;
    const arenaX = nx * snap.arenaW;
    const arenaY = (1 - ny) * snap.arenaH;
    onDeployRef.current(arenaX, arenaY);
  };

  return (
    <div ref={wrapRef} className={`arena-canvas-wrap${targeting ? ' targeting' : ''}`}>
      <canvas
        ref={canvasRef}
        className="arena-field-canvas"
        onPointerUp={onPointer}
      />
    </div>
  );
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

function drawHp(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  mine: boolean,
  width: number,
) {
  const h = 4;
  const w = width;
  const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(x - w / 2, y, w, h);
  g.fillStyle = mine ? '#4ade80' : '#f87171';
  g.fillRect(x - w / 2, y, w * pct, h);
}
