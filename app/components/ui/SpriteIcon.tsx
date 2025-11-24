'use client';

import React from 'react';
import { TILE_SIZE } from '@/lib/spriteConfig';

type Props = {
  gridX: number;
  gridY: number;
  size?: number;
  className?: string;
};

export function SpriteIcon({ gridX, gridY, size = TILE_SIZE * 2, className = '' }: Props) {
  const BASE_TILE_SIZE = TILE_SIZE || 32;
  const scale = size / BASE_TILE_SIZE;
  const px = -gridX * BASE_TILE_SIZE;
  const py = -gridY * BASE_TILE_SIZE;

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    overflow: 'hidden',
    display: 'inline-block'
  };

  const spriteStyle: React.CSSProperties = {
    width: BASE_TILE_SIZE,
    height: BASE_TILE_SIZE,
    backgroundPosition: `${px}px ${py}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left'
  };

  return (
    <div style={wrapperStyle} className={className}>
      <div className="sprite-base" style={spriteStyle} />
    </div>
  );
}
