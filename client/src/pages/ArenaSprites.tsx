/** Pseudo-3D awatary postaci Areny (CSS, bez assetów zewnętrznych). */

export type AvatarId =
  | 'knight'
  | 'goblin'
  | 'archer'
  | 'giant'
  | 'wizard'
  | 'dragon'
  | 'tower'
  | 'fireball'
  | 'king'
  | 'princess';

interface SpriteProps {
  avatar: AvatarId | string;
  mine?: boolean;
  anim?: string;
  facing?: number;
  attackAnim?: number;
  hitFlash?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ArenaSprite({
  avatar,
  mine = true,
  anim = 'idle',
  facing = 1,
  attackAnim = 0,
  hitFlash = 0,
  size = 'md',
  className = '',
}: SpriteProps) {
  const team = mine ? 'ally' : 'enemy';
  const attacking = attackAnim > 0;
  const hit = hitFlash > 0;

  return (
    <div
      className={[
        'asprite',
        `asprite-${avatar}`,
        `asprite-${size}`,
        `asprite-${team}`,
        `asprite-anim-${attacking ? 'attack' : anim}`,
        facing < 0 ? 'asprite-flip' : '',
        hit ? 'asprite-hit' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-hidden
    >
      <div className="asprite-shadow" />
      <div className="asprite-body">
        {avatar === 'knight' && <KnightParts />}
        {avatar === 'goblin' && <GoblinParts />}
        {avatar === 'archer' && <ArcherParts />}
        {avatar === 'giant' && <GiantParts />}
        {avatar === 'wizard' && <WizardParts />}
        {avatar === 'dragon' && <DragonParts />}
        {avatar === 'tower' && <TowerParts />}
        {avatar === 'fireball' && <FireballParts />}
        {avatar === 'king' && <KingTowerParts />}
        {avatar === 'princess' && <PrincessTowerParts />}
        {!['knight', 'goblin', 'archer', 'giant', 'wizard', 'dragon', 'tower', 'fireball', 'king', 'princess'].includes(avatar) && (
          <KnightParts />
        )}
      </div>
    </div>
  );
}

function KnightParts() {
  return (
    <>
      <span className="asp-leg asp-leg-l" />
      <span className="asp-leg asp-leg-r" />
      <span className="asp-torso knight-torso" />
      <span className="asp-arm asp-arm-l" />
      <span className="asp-arm asp-arm-r knight-sword" />
      <span className="asp-head knight-head" />
      <span className="asp-helm" />
      <span className="asp-shield" />
    </>
  );
}

function GoblinParts() {
  return (
    <>
      <span className="asp-leg asp-leg-l gob-leg" />
      <span className="asp-leg asp-leg-r gob-leg" />
      <span className="asp-torso gob-torso" />
      <span className="asp-arm asp-arm-l gob-arm" />
      <span className="asp-arm asp-arm-r gob-spear" />
      <span className="asp-head gob-head" />
      <span className="asp-ear asp-ear-l" />
      <span className="asp-ear asp-ear-r" />
    </>
  );
}

function ArcherParts() {
  return (
    <>
      <span className="asp-leg asp-leg-l arch-leg" />
      <span className="asp-leg asp-leg-r arch-leg" />
      <span className="asp-torso arch-torso" />
      <span className="asp-arm asp-arm-l arch-bow" />
      <span className="asp-arm asp-arm-r" />
      <span className="asp-head arch-head" />
      <span className="asp-hood" />
    </>
  );
}

function GiantParts() {
  return (
    <>
      <span className="asp-leg asp-leg-l giant-leg" />
      <span className="asp-leg asp-leg-r giant-leg" />
      <span className="asp-torso giant-torso" />
      <span className="asp-arm asp-arm-l giant-arm" />
      <span className="asp-arm asp-arm-r giant-arm" />
      <span className="asp-head giant-head" />
    </>
  );
}

function WizardParts() {
  return (
    <>
      <span className="asp-leg asp-leg-l wiz-leg" />
      <span className="asp-leg asp-leg-r wiz-leg" />
      <span className="asp-torso wiz-torso" />
      <span className="asp-arm asp-arm-l" />
      <span className="asp-arm asp-arm-r wiz-staff" />
      <span className="asp-head wiz-head" />
      <span className="asp-hat" />
      <span className="asp-orb" />
    </>
  );
}

function DragonParts() {
  return (
    <>
      <span className="asp-wing asp-wing-l" />
      <span className="asp-wing asp-wing-r" />
      <span className="asp-torso drag-torso" />
      <span className="asp-head drag-head" />
      <span className="asp-tail" />
    </>
  );
}

function TowerParts() {
  return (
    <>
      <span className="asp-tower-base" />
      <span className="asp-tower-mid" />
      <span className="asp-tower-top" />
      <span className="asp-tower-cannon" />
    </>
  );
}

function FireballParts() {
  return (
    <>
      <span className="asp-fire-core" />
      <span className="asp-fire-glow" />
    </>
  );
}

function KingTowerParts() {
  return (
    <>
      <span className="asp-kt-base" />
      <span className="asp-kt-body" />
      <span className="asp-kt-battlement" />
      <span className="asp-kt-crown" />
      <span className="asp-kt-flag" />
    </>
  );
}

function PrincessTowerParts() {
  return (
    <>
      <span className="asp-pt-base" />
      <span className="asp-pt-shaft" />
      <span className="asp-pt-top" />
      <span className="asp-pt-archer" />
    </>
  );
}

interface ProjectileProps {
  style: string;
  angle: number;
  className?: string;
}

export function ArenaProjectileVisual({ style, angle, className = '' }: ProjectileProps) {
  // angle w układzie areny (y w górę); CSS rotate potrzebuje ekranowego (y w dół) → negacja
  const deg = (-angle * 180) / Math.PI;
  return (
    <div
      className={`aproj aproj-${style} ${className}`}
      style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
      aria-hidden
    />
  );
}
