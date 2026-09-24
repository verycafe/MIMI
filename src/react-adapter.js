'use client';

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createAvatar } from './mimi-cat-avatars.mjs';

/**
 * React owns the host; the SDK owns the canvas inside it.
 * Importing this module does not access the DOM or create a WebGL context.
 */
export const CatAvatar = forwardRef(function CatAvatar({
  cat = 'american',
  state = 'default',
  size = 96,
  paused = false,
  interactive = true,
  speed = 1,
  label,
  onError,
  onFrame,
  className,
  style,
  children: _children,
  dangerouslySetInnerHTML: _html,
  ...attributes
}, forwardedRef) {
  const hostRef = useRef(null);
  const controllerRef = useRef(null);
  const committedRef = useRef(null);
  const lastReportedErrorRef = useRef(null);

  // Update the callback bridge after every commit, before mount/update effects.
  // Abandoned concurrent renders never replace callbacks on the live avatar.
  useEffect(() => {
    committedRef.current = {
      cat, state, size, paused, interactive, speed, label, onError, onFrame
    };
  });

  function reportError(error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    if (lastReportedErrorRef.current === normalized) return;
    lastReportedErrorRef.current = normalized;
    if (committedRef.current?.onError) committedRef.current.onError(normalized);
    else console.error('[Mimi CatAvatar]', normalized);
  }

  useEffect(() => {
    const host = hostRef.current;
    let controller;
    try {
      controller = createAvatar(host, {
        ...committedRef.current,
        onError: reportError,
        onFrame: pose => committedRef.current?.onFrame?.(pose)
      });
      controllerRef.current = controller;
    } catch (error) {
      reportError(error);
    }

    return () => {
      if (controllerRef.current === controller) controllerRef.current = null;
      controller?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!controllerRef.current) return;
    try {
      controllerRef.current.update({ cat, state, size, paused, interactive, speed, label });
    } catch (error) {
      reportError(error);
    }
  }, [cat, state, size, paused, interactive, speed, label]);

  useImperativeHandle(forwardedRef, () => ({
    get canvas() { return controllerRef.current?.canvas ?? null; },
    poke() { controllerRef.current?.poke(); },
    exportPNG(options) {
      if (!controllerRef.current) {
        return Promise.reject(new Error('The cat avatar is not mounted or could not be initialized.'));
      }
      return controllerRef.current.exportPNG(options);
    },
    renderImage(options) {
      return controllerRef.current?.renderImage(options) ?? null;
    }
  }), []);

  const side = Number.isInteger(size) && size >= 16 && size <= 2048 ? size : 96;
  return createElement('div', {
    ...attributes,
    ref: hostRef,
    className,
    style: {
      display: 'inline-block',
      width: side,
      height: side,
      maxWidth: '100%',
      flexShrink: 0,
      verticalAlign: 'middle',
      lineHeight: 0,
      ...style
    }
  });
});

CatAvatar.displayName = 'CatAvatar';

export default CatAvatar;
