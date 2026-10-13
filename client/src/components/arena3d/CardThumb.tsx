const THUMBS: Record<string, string> = {
  knight: '/arena/thumbs/knight.jpg',
  goblin: '/arena/thumbs/goblin.jpg',
  archer: '/arena/thumbs/archer.jpg',
  giant: '/arena/thumbs/giant.jpg',
  wizard: '/arena/thumbs/wizard.jpg',
  dragon: '/arena/thumbs/dragon.jpg',
  tower: '/arena/thumbs/tower.jpg',
  fireball: '/arena/thumbs/fireball.jpg',
};

interface CardThumbProps {
  avatar?: string;
  alt?: string;
  className?: string;
}

export default function CardThumb({ avatar = 'knight', alt = '', className = '' }: CardThumbProps) {
  const src = THUMBS[avatar] || THUMBS.knight;
  return (
    <img
      className={`arena-card-thumb ${className}`.trim()}
      src={src}
      alt={alt}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}
