/** Eight fixed designs. Coat colors are part of each design, not runtime options. */
export type CatId = 'american' | 'ginger' | 'black' | 'tabby' | 'cream' | 'ragdoll' | 'calico' | 'cow';
export type AvatarState = 'default' | 'working' | 'sleeping';

export interface CatShape {
  readonly kind: 'classic' | 'broad' | 'wedge' | 'ruff';
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly rigid?: boolean;
  readonly earHeight: number;
  readonly earWidth: number;
  readonly earX: number;
  readonly eyeX: number;
  readonly eyeY: number;
  readonly eyeW: number;
  readonly eyeH: number;
  readonly eyeTilt: number;
  readonly muzzleW: number;
  readonly muzzleDepth: number;
  readonly muzzleY: number;
}

export interface CatDefinition {
  readonly id: CatId;
  readonly name: string;
  readonly english: string;
  readonly coatName: string;
  readonly description: string;
  readonly rgb: string;
  readonly background: string;
  readonly accent: string;
  readonly coat: string;
  readonly light: string;
  readonly marking: string;
  readonly secondary: string;
  readonly iris: string;
  readonly pupil: string;
  readonly nose: string;
  readonly ear: string;
  readonly muzzle: string;
  readonly earCoats: readonly [string, string];
  readonly pattern: number;
  readonly shape: CatShape;
}

/** Motion values passed to onFrame. Angles are in radians. */
export interface AvatarPose {
  readonly yaw: number;
  readonly pitch: number;
  readonly roll: number;
  readonly x: number;
  readonly y: number;
  readonly sx: number;
  readonly sy: number;
  readonly eyeOpen: number;
  readonly blinkL: number;
  readonly blinkR: number;
  readonly lookX: number;
  readonly lookY: number;
  readonly breath: number;
  readonly laugh: number;
  readonly whirl: number;
  readonly whirlAngle: number;
  /** Blend weights for default, working, and sleeping, in that order. */
  readonly w: readonly number[];
}

export interface AvatarOptions {
  /** @default 'american' */
  cat?: CatId;
  /** @default 'default' */
  state?: AvatarState;
  /** CSS size in pixels. Integer, 16–2048. @default 96 */
  size?: number;
  /** @default false */
  paused?: boolean;
  /** Pointer tracking, keyboard activation, and touch/click interaction. @default true */
  interactive?: boolean;
  /** Animation speed from 0 to 4. @default 1 */
  speed?: number;
  /** Accessible canvas label; a label based on the selected cat is used when omitted. */
  label?: string;
  onError?: (error: Error) => void;
  onFrame?: (pose: AvatarPose) => void;
}

export interface ExportPNGOptions {
  /** Output width and height in pixels. Integer, 16–4096. @default 1024 */
  size?: number;
}

export interface RenderImageOptions {
  /** Defaults to the instance's current cat. */
  cat?: CatId;
  /** Defaults to the instance's current state. */
  state?: AvatarState;
  /** Output width and height in pixels. Integer, 16–4096. @default 320 */
  size?: number;
}

export interface AvatarInstance {
  readonly canvas: HTMLCanvasElement;
  update(options: Partial<AvatarOptions>): void;
  poke(): void;
  exportPNG(options?: ExportPNGOptions): Promise<Blob>;
  /** Render a static image without changing the displayed cat or state. */
  renderImage(options?: RenderImageOptions): HTMLCanvasElement;
  /** Release animation, observers, listeners, and WebGL resources. Safe to call twice. */
  destroy(): void;
}

export declare const cats: readonly CatDefinition[];

/** Call in the browser after the target element is mounted. Requires WebGL 2. */
export declare function createAvatar(target: HTMLElement, options?: AvatarOptions): AvatarInstance;

declare const MimiAvatars: {
  readonly cats: typeof cats;
  readonly createAvatar: typeof createAvatar;
};

export default MimiAvatars;
