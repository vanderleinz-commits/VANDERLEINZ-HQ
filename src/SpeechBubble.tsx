import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export function SpeechBubble({ name, text, color }: { name: string; text: string; color: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 172;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fffcf3'; ctx.beginPath(); ctx.roundRect(3, 3, 506, 148, 24); ctx.fill();
      ctx.beginPath(); ctx.moveTo(230, 148); ctx.lineTo(256, 170); ctx.lineTo(275, 148); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(3, 3, 506, 148, 24); ctx.stroke();
      ctx.fillStyle = color; ctx.font = 'bold 21px Arial'; ctx.fillText(name, 23, 36);
      ctx.fillStyle = '#425d63'; ctx.font = '24px Arial';
      const words = text.split(' '); let line = '', y = 76;
      for (const word of words) {
        const next = line ? line + ' ' + word : word;
        if (ctx.measureText(next).width > 460) { ctx.fillText(line, 23, y); y += 30; line = word; } else line = next;
      }
      ctx.fillText(line, 23, y);
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [name, text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={[0, 2.13, 0]} scale={[2.95, 0.99, 1]} renderOrder={25}><spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} /></sprite>;
}
