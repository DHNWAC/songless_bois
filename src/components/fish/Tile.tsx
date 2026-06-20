'use client';

import { TileType } from '@/lib/fish/puzzle';

export type TileHighlight = 'none' | 'hint' | 'post-safe' | 'post-danger';

interface TileProps {
  type: TileType;
  hasRock: boolean;
  item?: 'bonus_fish' | 'treasure' | 'jellyfish';
  isShark: boolean;
  sharkAnimKey: number;
  highlight: TileHighlight;
  canInteract: boolean;
  onClick: () => void;
}

const ITEM_EMOJI: Record<string, string> = {
  bonus_fish: '🐠',
  treasure: '🐚',
  jellyfish: '🪼',
};

export default function Tile({
  type,
  hasRock,
  item,
  isShark,
  sharkAnimKey,
  highlight,
  canInteract,
  onClick,
}: TileProps) {
  const classes = [
    'fish-tile',
    type === 'coral' ? 'fish-tile-coral' : 'fish-tile-water',
    hasRock ? 'fish-tile-has-rock' : '',
    canInteract ? 'fish-tile-interactive' : '',
    highlight !== 'none' ? `fish-tile-${highlight}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  let content = '';
  if (hasRock) content = '🪨';
  else if (isShark) content = '🦈';
  else if (item) content = ITEM_EMOJI[item];
  else if (type === 'coral') content = '🪸';

  return (
    <div
      className={classes}
      onClick={canInteract ? onClick : undefined}
      role={canInteract ? 'button' : undefined}
    >
      <span
        className="fish-tile-content"
        key={isShark ? sharkAnimKey : undefined}
        style={isShark ? { animation: 'shark-move 0.18s ease-out' } : undefined}
      >
        {content}
      </span>
    </div>
  );
}
