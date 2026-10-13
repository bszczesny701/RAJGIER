/** Modele postaci Areny — warstwowe, pseudo-3D, z FX ataków. */

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

const KNOWN: AvatarId[] = [
  'knight', 'goblin', 'archer', 'giant', 'wizard', 'dragon', 'tower', 'fireball', 'king', 'princess',
];

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
  const id = (KNOWN.includes(avatar as AvatarId) ? avatar : 'knight') as AvatarId;

  return (
    <div
      className={[
        'asprite',
        'asprite-3d',
        `asprite-${id}`,
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
      <div className="asprite-stage">
        <div className="asprite-body">
          {id === 'knight' && <KnightParts attacking={attacking} />}
          {id === 'goblin' && <GoblinParts attacking={attacking} />}
          {id === 'archer' && <ArcherParts attacking={attacking} />}
          {id === 'giant' && <GiantParts attacking={attacking} />}
          {id === 'wizard' && <WizardParts attacking={attacking} />}
          {id === 'dragon' && <DragonParts attacking={attacking} />}
          {id === 'tower' && <TowerParts attacking={attacking} />}
          {id === 'fireball' && <FireballParts />}
          {id === 'king' && <KingTowerParts attacking={attacking} />}
          {id === 'princess' && <PrincessTowerParts attacking={attacking} />}
        </div>
      </div>
    </div>
  );
}

function KnightParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-plate asp-plate-back" />
      <span className="asp-leg asp-leg-l" />
      <span className="asp-leg asp-leg-r" />
      <span className="asp-torso knight-torso" />
      <span className="asp-pauldron asp-pauldron-l" />
      <span className="asp-pauldron asp-pauldron-r" />
      <span className="asp-arm asp-arm-l" />
      <span className={`asp-arm asp-arm-r knight-sword${attacking ? ' swinging' : ''}`} />
      <span className="asp-head knight-head" />
      <span className="asp-helm" />
      <span className="asp-visor" />
      <span className="asp-shield" />
      {attacking && <span className="asp-fx asp-fx-slash" />}
    </>
  );
}

function GoblinParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-leg asp-leg-l gob-leg" />
      <span className="asp-leg asp-leg-r gob-leg" />
      <span className="asp-torso gob-torso" />
      <span className="asp-arm asp-arm-l gob-arm" />
      <span className={`asp-arm asp-arm-r gob-spear${attacking ? ' thrusting' : ''}`} />
      <span className="asp-head gob-head" />
      <span className="asp-ear asp-ear-l" />
      <span className="asp-ear asp-ear-r" />
      <span className="asp-eye asp-eye-l" />
      <span className="asp-eye asp-eye-r" />
      {attacking && <span className="asp-fx asp-fx-stab" />}
    </>
  );
}

function ArcherParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-leg asp-leg-l arch-leg" />
      <span className="asp-leg asp-leg-r arch-leg" />
      <span className="asp-torso arch-torso" />
      <span className={`asp-arm asp-arm-l arch-bow${attacking ? ' drawn' : ''}`} />
      <span className="asp-arm asp-arm-r" />
      <span className="asp-head arch-head" />
      <span className="asp-hood" />
      {attacking && <span className="asp-fx asp-fx-arrow" />}
    </>
  );
}

function GiantParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-leg asp-leg-l giant-leg" />
      <span className="asp-leg asp-leg-r giant-leg" />
      <span className={`asp-torso giant-torso${attacking ? ' slamming' : ''}`} />
      <span className="asp-arm asp-arm-l giant-arm" />
      <span className="asp-arm asp-arm-r giant-arm" />
      <span className="asp-head giant-head" />
      <span className="asp-brow" />
      {attacking && <span className="asp-fx asp-fx-slam" />}
    </>
  );
}

function WizardParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-robe" />
      <span className="asp-leg asp-leg-l wiz-leg" />
      <span className="asp-leg asp-leg-r wiz-leg" />
      <span className="asp-torso wiz-torso" />
      <span className="asp-arm asp-arm-l" />
      <span className={`asp-arm asp-arm-r wiz-staff${attacking ? ' casting' : ''}`} />
      <span className="asp-head wiz-head" />
      <span className="asp-hat" />
      <span className={`asp-orb${attacking ? ' blasting' : ''}`} />
      {attacking && <span className="asp-fx asp-fx-bolt" />}
    </>
  );
}

function DragonParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-wing asp-wing-l" />
      <span className="asp-wing asp-wing-r" />
      <span className="asp-torso drag-torso" />
      <span className="asp-belly" />
      <span className="asp-head drag-head" />
      <span className="asp-jaw" />
      <span className="asp-horn asp-horn-l" />
      <span className="asp-horn asp-horn-r" />
      <span className="asp-tail" />
      <span className={`asp-fx asp-fx-breath${attacking ? ' on' : ''}`} />
    </>
  );
}

function TowerParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-tower-base" />
      <span className="asp-tower-mid" />
      <span className="asp-tower-top" />
      <span className={`asp-tower-cannon${attacking ? ' firing' : ''}`} />
      {attacking && <span className="asp-fx asp-fx-muzzle" />}
    </>
  );
}

function FireballParts() {
  return (
    <>
      <span className="asp-fire-glow" />
      <span className="asp-fire-core" />
      <span className="asp-fire-spark s1" />
      <span className="asp-fire-spark s2" />
    </>
  );
}

function KingTowerParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-kt-base" />
      <span className="asp-kt-body" />
      <span className="asp-kt-ledge" />
      <span className="asp-kt-battlement" />
      <span className="asp-kt-crown" />
      <span className="asp-kt-flag" />
      <span className={`asp-kt-gun${attacking ? ' firing' : ''}`} />
      {attacking && <span className="asp-fx asp-fx-muzzle" />}
    </>
  );
}

function PrincessTowerParts({ attacking }: { attacking: boolean }) {
  return (
    <>
      <span className="asp-pt-base" />
      <span className="asp-pt-shaft" />
      <span className="asp-pt-band" />
      <span className="asp-pt-top" />
      <span className="asp-pt-archer" />
      {attacking && <span className="asp-fx asp-fx-arrow" />}
    </>
  );
}

interface ProjectileProps {
  style: string;
  angle: number;
  className?: string;
}

export function ArenaProjectileVisual({ style, angle, className = '' }: ProjectileProps) {
  const deg = (-angle * 180) / Math.PI;
  return (
    <div
      className={`aproj aproj-${style} ${className}`}
      style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
      aria-hidden
    >
      {style === 'fire' && <span className="aproj-fire-tail" />}
      {style === 'arrow' && <span className="aproj-arrow-tip" />}
    </div>
  );
}
