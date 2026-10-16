import * as THREE from 'three';

type Surface = 'wood' | 'fabric' | 'stone';
const cache = new Map<string, THREE.CanvasTexture>();
const FLOOR_PATCH_SIZE = 3.2;

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

function canvasFor(width: number, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable for office materials.');
  return { canvas, context };
}

function finish(key: string, canvas: HTMLCanvasElement, repeating = false) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `Blue and Space ${key}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (repeating) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  cache.set(key, texture);
  return texture;
}

/** Shared color maps: pair with a white material tint to retain the requested color. */
export function materialMap(surface: Surface, color: string): THREE.CanvasTexture {
  const key = `material:${surface}:${color}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const size = surface === 'fabric' ? 256 : 512;
  const { canvas, context: ctx } = canvasFor(size);
  const random = seeded(hash(key));
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  if (surface === 'wood') {
    for (let i = 0; i < 540; i++) {
      const y = random() * size;
      const curve = (random() - .5) * 8;
      ctx.strokeStyle = random() > .38
        ? `rgba(42,30,23,${.018 + random() * .045})`
        : `rgba(255,245,220,${.018 + random() * .045})`;
      ctx.lineWidth = .35 + random() * 1.1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * .28, y + curve, size * .74, y - curve, size, y);
      ctx.stroke();
    }
  } else if (surface === 'fabric') {
    for (let i = 0; i < size; i += 2) {
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255,249,232,.065)' : 'rgba(20,38,44,.055)';
      ctx.lineWidth = .65;
      ctx.beginPath();
      ctx.moveTo(i + .5, 0); ctx.lineTo(i + .5, size);
      ctx.stroke();
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(20,38,44,.04)' : 'rgba(255,249,232,.04)';
      ctx.beginPath();
      ctx.moveTo(0, i + .5); ctx.lineTo(size, i + .5);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 3200; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,249,231,.05)' : 'rgba(73,69,61,.03)';
      const radius = .2 + random() * .6;
      ctx.fillRect(random() * size, random() * size, radius, radius);
    }
    for (let i = 0; i < 12; i++) {
      const x = random() * size, y = random() * size;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 35 + random() * 95);
      gradient.addColorStop(0, 'rgba(255,249,231,.035)');
      gradient.addColorStop(1, 'rgba(255,249,231,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
  }
  return finish(key, canvas, true);
}

/** One repeat covers 3.2 world units, keeping plank and tile sizes equal across rooms. */
export function floorMap(width: number, depth: number, tiled = false): THREE.CanvasTexture {
  const w = Math.max(.05, Number.isFinite(width) ? width : 1);
  const d = Math.max(.05, Number.isFinite(depth) ? depth : 1);
  const key = `floor:${w}:${d}:${tiled}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const size = 512;
  const { canvas, context: ctx } = canvasFor(size);
  const random = seeded(tiled ? 2718 : 321);
  ctx.fillStyle = tiled ? '#d6d0c2' : '#8e7963';
  ctx.fillRect(0, 0, size, size);

  if (tiled) {
    const tile = size / 4;
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const tone = Math.round((random() - .5) * 8);
      ctx.fillStyle = `rgb(${231 + tone},${224 + tone},${208 + tone})`;
      ctx.fillRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
      ctx.fillStyle = 'rgba(255,251,238,.22)';
      ctx.fillRect(col * tile + 2, row * tile + 2, tile - 4, 1);
      for (let speck = 0; speck < 140; speck++) {
        ctx.fillStyle = speck % 2 ? 'rgba(91,83,68,.035)' : 'rgba(255,255,245,.13)';
        ctx.fillRect(col * tile + random() * tile, row * tile + random() * tile, .7, .7);
      }
    }
  } else {
    const rowHeight = size / 16;
    const plankLength = size / 2;
    for (let row = 0; row < 16; row++) {
      const offset = (row % 4) * (plankLength / 4);
      for (let col = -1; col < 3; col++) {
        const x = col * plankLength + offset;
        const y = row * rowHeight;
        const tone = Math.round((random() - .5) * 15);
        ctx.fillStyle = `rgb(${160 + tone},${139 + tone},${112 + tone})`;
        ctx.fillRect(x + .65, y + .6, plankLength - 1.3, rowHeight - 1.2);
        ctx.save();
        ctx.beginPath(); ctx.rect(x + 1, y + 1, plankLength - 2, rowHeight - 2); ctx.clip();
        for (let grain = 0; grain < 15; grain++) {
          const gy = y + random() * rowHeight;
          const wave = (random() - .5) * 4;
          ctx.strokeStyle = `rgba(57,44,32,${.018 + random() * .05})`;
          ctx.lineWidth = .35 + random() * .55;
          ctx.beginPath(); ctx.moveTo(x, gy);
          ctx.bezierCurveTo(x + 70, gy + wave, x + 180, gy - wave, x + plankLength, gy);
          ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = 'rgba(255,243,218,.16)';
        ctx.fillRect(x + 1, y + 1, plankLength - 2, .65);
      }
    }
  }

  const texture = finish(key, canvas, true);
  texture.repeat.set(w / FLOOR_PATCH_SIZE, d / FLOOR_PATCH_SIZE);
  return texture;
}

export function skyWindowMap(): THREE.CanvasTexture {
  const key = 'window:sky';
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, context: ctx } = canvasFor(1024, 512);
  const random = seeded(417);
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#adc7d3');
  sky.addColorStop(.65, '#d9e1dc');
  sky.addColorStop(1, '#e8dfc9');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1024, 512);
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < 28; i++) {
      const x = i * 39 + layer * 12;
      const h = 35 + random() * (layer === 0 ? 92 : 62);
      ctx.fillStyle = layer === 0 ? 'rgba(142,170,180,.19)' : 'rgba(161,183,185,.22)';
      ctx.fillRect(x, 512 - h, 25 + random() * 22, h);
    }
  }
  return finish(key, canvas);
}

export function screenMap(): THREE.CanvasTexture {
  const key = 'screen:dashboard';
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, context: ctx } = canvasFor(640, 400);
  ctx.fillStyle = '#213b4c'; ctx.fillRect(0, 0, 640, 400);
  ctx.fillStyle = '#192f3e'; ctx.fillRect(0, 0, 126, 400);
  ctx.fillStyle = '#c7d8d9'; ctx.font = 'bold 23px sans-serif';
  ctx.fillText('Blue and Space', 151, 43);
  ctx.fillStyle = '#6e929d'; ctx.fillRect(151, 61, 456, 3);
  ctx.fillStyle = '#c5b59b'; ctx.fillRect(151, 88, 213, 143);
  ctx.fillStyle = '#a2bbc3'; ctx.fillRect(382, 88, 225, 63);
  ctx.fillStyle = '#668694'; ctx.fillRect(382, 168, 225, 63);
  ctx.fillStyle = '#435e6c'; ctx.fillRect(171, 176, 173, 35);
  ctx.fillStyle = '#ddd7c6'; ctx.fillRect(182, 188, 104, 4);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#a7c0c5'; ctx.fillRect(151, 265 + i * 22, 390 - (i % 3) * 51, 5);
    ctx.fillStyle = i === 0 ? '#abc4c6' : '#688792'; ctx.fillRect(23, 92 + i * 48, 77, 5);
  }
  ctx.fillStyle = '#c5b59b'; ctx.beginPath(); ctx.arc(42, 41, 13, 0, Math.PI * 2); ctx.fill();
  return finish(key, canvas);
}
