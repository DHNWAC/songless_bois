'use client';

import { TileType } from '@/lib/fish/puzzle';

export type TileHighlight = 'none' | 'preview-danger' | 'post-safe' | 'post-danger';

interface TileProps {
  type: TileType;
  hasRock: boolean;
  highlight: TileHighlight;
  canInteract: boolean;
  onClick: () => void;
}

const EMOJI: Partial<Record<TileType, string>> = {
  coral: '🪸',
  fish: '🐟',
  shark: '🦈',
  bonus_fish: '🐠',
  treasure: '🐚',
  jellyfish: '🪼',
};

export default function Tile({ type, hasRock, highlight, canInteract, onClick }: TileProps) {
  const classes = [
    'fish-tile',
    type === 'coral' ? 'fish-tile-coral' : 'fish-tile-water',
    hasRock ? 'fish-tile-has-rock' : '',
    canInteract ? 'fish-tile-interactive' : '',
    highlight !== 'none' ? `fish-tile-${highlight}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = hasRock ? '🪨' : (EMOJI[type] ?? '');

  return (
    <div className={classes} onClick={canInteract ? onClick : undefined} role={canInteract ? 'button' : undefined}>
      <span className="fish-tile-content">{content}</span>
    </div>
  );
}
