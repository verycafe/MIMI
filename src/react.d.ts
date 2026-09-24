import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';
import type {
  AvatarOptions,
  ExportPNGOptions,
  RenderImageOptions
} from './mimi-cat-avatars.mjs';

export interface CatAvatarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError' | 'children' | 'dangerouslySetInnerHTML'>,
    AvatarOptions {
  /** The SDK owns the host's contents. Render adjacent content outside the avatar. */
  children?: never;
  dangerouslySetInnerHTML?: never;
}

export interface CatAvatarHandle {
  /** Null before initialization or when initialization fails. */
  readonly canvas: HTMLCanvasElement | null;
  /** Does nothing until the avatar is mounted. */
  poke(): void;
  /** Rejects if the avatar is not mounted or initialization failed. */
  exportPNG(options?: ExportPNGOptions): Promise<Blob>;
  /** Returns null if the avatar is not mounted or initialization failed. */
  renderImage(options?: RenderImageOptions): HTMLCanvasElement | null;
}

/** SSR-safe host; the avatar is created after mounting and disposed on unmount. */
export declare const CatAvatar: ForwardRefExoticComponent<CatAvatarProps & RefAttributes<CatAvatarHandle>>;

export default CatAvatar;
