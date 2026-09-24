/* Mimi Avatars public browser runtime.
   All instances share one WebGL context and one animation clock. Each mount
   receives a transparent 2D canvas, so a list of cats does not exhaust the
   browser's WebGL context limit. No DOM is accessed while importing. */
window.MimiAvatars = (() => {
  'use strict';

  const cats = CatCatalog;
  const catalog = new Map(cats.map(cat => [cat.id, cat]));
  const states = new Set(['default', 'working', 'sleeping']);
  const optionKeys = new Set(['cat', 'state', 'size', 'paused', 'interactive', 'speed', 'label', 'onError', 'onFrame']);
  const defaults = Object.freeze({ cat: 'american', state: 'default', size: 96, paused: false, interactive: true, speed: 1, label: undefined, onError: undefined, onFrame: undefined });
  const stateLabels = { default: '好奇', working: '工作中', sleeping: '休息中' };
  // A single framing window for every size and cat, with room for the ears and
  // the original hop animation. Uniform source/destination scaling is retained.
  const framing = Object.freeze({ x: .07, y: .035, width: .86, height: .86 });
  let pool = null;

  function positiveSize(value, maximum, label) {
    if (!Number.isInteger(value) || value < 16 || value > maximum) {
      throw new RangeError(`${label} must be an integer from 16 to ${maximum}.`);
    }
    return value;
  }

  function optionsWith(patch, previous = defaults) {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Avatar options must be an object.');
    for (const key of Object.keys(patch)) if (!optionKeys.has(key)) throw new TypeError(`Unknown avatar option: ${key}.`);
    const next = { ...previous, ...patch };
    if (!catalog.has(next.cat)) throw new RangeError(`Unknown cat: ${String(next.cat)}.`);
    if (!states.has(next.state)) throw new RangeError(`Unknown avatar state: ${String(next.state)}.`);
    positiveSize(next.size, 2048, 'size');
    if (typeof next.paused !== 'boolean' || typeof next.interactive !== 'boolean') throw new TypeError('paused and interactive must be booleans.');
    if (!Number.isFinite(next.speed) || next.speed < 0 || next.speed > 4) throw new RangeError('speed must be a number from 0 to 4.');
    if (next.label !== undefined && typeof next.label !== 'string') throw new TypeError('label must be a string.');
    for (const key of ['onError', 'onFrame']) if (next[key] !== undefined && typeof next[key] !== 'function') throw new TypeError(`${key} must be a function.`);
    return next;
  }

  function notifyError(record, error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    if (record.options.onError) {
      try { record.options.onError(failure); }
      catch (callbackError) { record.pool.view.console?.error('Mimi onError callback:', callbackError); }
    } else record.pool.view.console?.error('Mimi Avatars:', failure);
    return failure;
  }

  function inViewport(record) {
    const rect = record.canvas.getBoundingClientRect();
    const view = record.pool.view;
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
  }

  function poseFor(record) {
    return record.pool.reduced ? CatMotion.restPose(record.options.state) : record.sim.pose;
  }

  function canAnimate(record) {
    return !record.destroyed && !record.failed && record.visible && !record.options.paused && record.options.speed > 0 && !record.pool.reduced;
  }

  function resetClock(record) { record.lastTick = 0; }

  function dimensions(record) {
    const measured = record.canvas.getBoundingClientRect().width;
    const cssSize = measured > 0 ? measured : record.options.size;
    const pixels = Math.min(2048, Math.max(16, Math.round(cssSize * Math.min(record.pool.view.devicePixelRatio || 1, 2))));
    if (record.canvas.width !== pixels || record.canvas.height !== pixels) {
      record.canvas.width = record.canvas.height = pixels;
      record.dirty = true;
    }
    record.pixels = pixels;
    record.cssSize = cssSize;
  }

  function fitSharedCanvas(shared, extraRecord) {
    let required = extraRecord?.pixels || 16;
    for (const record of shared.records) if (record.visible && !record.destroyed) required = Math.max(required, record.pixels);
    // Keep the framebuffer stable while rendering a batch of differently sized
    // avatars. Buckets avoid reallocating it during tiny layout changes.
    const size = Math.min(2048, Math.max(64, Math.pow(2, Math.ceil(Math.log2(required)))));
    if (shared.canvas.width !== size) shared.canvas.width = shared.canvas.height = size;
  }

  function copyFramed(context, source, size, renderSize = source.width, sourceY = 0) {
    context.clearRect(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, renderSize * framing.x, sourceY + renderSize * framing.y, renderSize * framing.width, renderSize * framing.height, 0, 0, size, size);
  }

  function drawRecord(record) {
    if (record.destroyed || record.pool.lost || !record.pool.renderer) return;
    const pose = poseFor(record);
    const size = record.pixels, sharedCanvas = record.pool.canvas;
    // The framebuffer keeps its largest allocation, while each avatar shades
    // only its own pixel-sized viewport. WebGL's lower-left viewport appears at
    // this vertical offset when the 2D canvas copies it with top-left coordinates.
    record.pool.renderer.draw(pose, record.options.cat, size, size);
    copyFramed(record.context, sharedCanvas, size, size, sharedCanvas.height - size);
    record.dirty = false;
    if (record.options.onFrame) {
      // A callback receives a snapshot; changing it cannot deform another frame.
      try { record.options.onFrame({ ...pose, w: [...pose.w] }); }
      catch (error) { notifyError(record, error); }
    }
  }

  function schedule(shared) {
    if (shared.disposed || shared.frame || shared.lost || shared.document.hidden) return;
    if (![...shared.records].some(record => !record.destroyed && !record.failed && record.visible && (record.dirty || canAnimate(record)))) return;
    shared.frame = shared.requestFrame(now => tick(shared, now));
  }

  function stopFrame(shared) {
    if (shared.frame) shared.cancelFrame(shared.frame);
    shared.frame = 0;
  }

  function tick(shared, now) {
    shared.frame = 0;
    if (shared.disposed || shared.lost || shared.document.hidden) return;
    fitSharedCanvas(shared);
    for (const record of [...shared.records]) {
      if (record.destroyed || !record.visible || record.failed) continue;
      const moving = canAnimate(record);
      // Large previews remain fluid; an avatar up to 160 px is capped at 30 fps.
      const interval = record.cssSize <= 160 ? 1000 / 30 : 1000 / 60;
      if (!record.dirty && (!moving || now - record.lastDraw < interval - 1)) continue;
      try {
        if (moving) {
          const seconds = record.lastTick ? Math.min(.075, Math.max(0, (now - record.lastTick) / 1000)) : 1 / 60;
          record.sim.update(seconds * record.options.speed * .85);
          record.lastTick = now;
        } else resetClock(record);
        drawRecord(record);
        record.lastDraw = now;
      } catch (error) {
        record.failed = true; record.dirty = false;
        notifyError(record, error);
      }
    }
    schedule(shared);
  }

  function createPool(document) {
    const view = document.defaultView;
    if (!view) throw new Error('Mimi Avatars requires a browser document.');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const shared = {
      document, view, canvas, renderer: null, records: new Set(), frame: 0,
      lost: false, disposed: false, reduced: false, cleanups: [],
      requestFrame: view.requestAnimationFrame ? view.requestAnimationFrame.bind(view) : callback => view.setTimeout(() => callback(view.performance?.now() || Date.now()), 17),
      cancelFrame: view.cancelAnimationFrame ? view.cancelAnimationFrame.bind(view) : view.clearTimeout.bind(view)
    };
    shared.renderer = Cat3D.create(canvas);
    try {
    const listen = (target, event, callback, options) => {
      target.addEventListener(event, callback, options);
      shared.cleanups.push(() => target.removeEventListener(event, callback, options));
    };
    const refreshVisibility = () => {
      for (const record of shared.records) {
        if (!shared.intersectionObserver) record.visible = inViewport(record);
        resetClock(record);
        if (!document.hidden && record.visible) record.dirty = true;
      }
      if (document.hidden) stopFrame(shared);
      else schedule(shared);
    };
    listen(document, 'visibilitychange', refreshVisibility);
    listen(view, 'blur', () => { for (const record of shared.records) record.sim.setPointer(0, 0, 0); });
    listen(view, 'resize', () => {
      for (const record of shared.records) dimensions(record);
      refreshVisibility();
    });
    if (view.IntersectionObserver) {
      shared.intersectionObserver = new view.IntersectionObserver(entries => {
        for (const entry of entries) {
          const record = [...shared.records].find(candidate => candidate.canvas === entry.target);
          if (!record) continue;
          record.visible = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
          resetClock(record);
          if (record.visible) { dimensions(record); record.dirty = true; }
        }
        schedule(shared);
      }, { threshold: 0 });
      shared.cleanups.push(() => shared.intersectionObserver.disconnect());
    } else listen(view, 'scroll', refreshVisibility, { passive: true, capture: true });
    if (view.ResizeObserver) {
      shared.resizeObserver = new view.ResizeObserver(entries => {
        for (const entry of entries) {
          const record = [...shared.records].find(candidate => candidate.canvas === entry.target);
          if (record) { dimensions(record); if (!shared.intersectionObserver) record.visible = inViewport(record); }
        }
        schedule(shared);
      });
      shared.cleanups.push(() => shared.resizeObserver.disconnect());
    }
    if (view.matchMedia) {
      const query = view.matchMedia('(prefers-reduced-motion: reduce)');
      shared.reduced = query.matches;
      const onMotion = () => {
        shared.reduced = query.matches;
        for (const record of shared.records) {
          record.sim.setPointer(0, 0, 0); resetClock(record); record.dirty = true;
        }
        schedule(shared);
      };
      if (query.addEventListener) { query.addEventListener('change', onMotion); shared.cleanups.push(() => query.removeEventListener('change', onMotion)); }
      else if (query.addListener) { query.addListener(onMotion); shared.cleanups.push(() => query.removeListener(onMotion)); }
    }
    listen(canvas, 'webglcontextlost', event => {
      event.preventDefault(); shared.lost = true; stopFrame(shared);
      for (const record of [...shared.records]) {
        resetClock(record);
        notifyError(record, new Error('Mimi graphics context was lost. The last image is retained while the browser restores it.'));
      }
    });
    listen(canvas, 'webglcontextrestored', () => {
      if (shared.disposed) return;
      try {
        shared.renderer?.destroy();
        shared.renderer = Cat3D.create(canvas);
        shared.lost = false;
        for (const record of shared.records) { record.failed = false; record.dirty = true; resetClock(record); }
        schedule(shared);
      } catch (error) {
        shared.lost = true;
        for (const record of [...shared.records]) notifyError(record, error);
      }
    });
    return shared;
    } catch (error) {
      for (const cleanup of shared.cleanups) cleanup();
      shared.renderer.destroy();
      throw error;
    }
  }

  function releasePool(shared) {
    if (shared.records.size || shared.disposed) return;
    shared.disposed = true;
    stopFrame(shared);
    for (const cleanup of shared.cleanups) cleanup();
    shared.renderer?.destroy();
    shared.renderer = null;
    // The browser owns context retirement. Deliberately do not call
    // WEBGL_lose_context: it would interfere with rapid React remounts.
    shared.canvas.width = shared.canvas.height = 1;
    if (pool === shared) pool = null;
  }

  function createAvatar(target, options = {}) {
    const next = optionsWith(options);
    if (!target || !target.ownerDocument?.defaultView || !(target instanceof target.ownerDocument.defaultView.HTMLElement)) {
      throw new TypeError('createAvatar expects an HTMLElement mount target.');
    }
    const document = target.ownerDocument;
    if (pool && pool.document !== document) throw new Error('A Mimi module instance must be mounted in one document. Load a separate module inside another frame.');
    if (target.childNodes.length) throw new Error('The avatar mount target must be empty and reserved for this instance.');
    let shared;
    try { shared = pool || (pool = createPool(document)); }
    catch (error) {
      if (next.onError) { try { next.onError(error); } catch (_) { /* Preserve the initialization error. */ } }
      throw error;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      releasePool(shared);
      const error = new Error('This browser cannot create a 2D avatar canvas.');
      if (next.onError) { try { next.onError(error); } catch (_) { /* Preserve the allocation error. */ } }
      throw error;
    }
    canvas.className = 'mimi-avatar';
    canvas.style.display = 'block'; canvas.style.maxWidth = '100%'; canvas.style.height = 'auto'; canvas.style.aspectRatio = '1';
    const sim = new CatMotion.Sim(.42 + cats.findIndex(cat => cat.id === next.cat) * .073, next.state);
    sim.setTurn(.44);
    sim.setJump({ height: 17, time: .66, stretch: .22, squash: .20, every: 0, spin: 1, lean: 4 });
    sim.pose = CatMotion.restPose(next.state);
    const record = { pool: shared, target, canvas, context, sim, options: next, pixels: 1, cssSize: next.size, visible: true, dirty: true, failed: false, destroyed: false, lastTick: 0, lastDraw: 0, cleanups: [] };

    function alive() { if (record.destroyed) throw new Error('This Mimi avatar has been destroyed.'); }
    function labelCanvas() {
      const config = record.options;
      const label = config.label ?? `${catalog.get(config.cat).name}，${stateLabels[config.state]}${config.interactive ? '；点击或按回车、空格打个招呼' : ''}`;
      canvas.setAttribute('aria-label', label);
      canvas.setAttribute('role', config.interactive ? 'button' : 'img');
      if (config.interactive) canvas.tabIndex = 0;
      else canvas.removeAttribute('tabindex');
      canvas.style.cursor = config.interactive ? 'pointer' : 'default';
      canvas.style.width = `${config.size}px`;
    }
    function listen(event, callback) {
      canvas.addEventListener(event, callback);
      record.cleanups.push(() => canvas.removeEventListener(event, callback));
    }
    function poke() {
      alive();
      if (!record.options.paused && !shared.reduced && !shared.lost && record.options.speed > 0) {
        sim.poke(); record.dirty = true; schedule(shared);
      }
    }
    listen('click', () => { if (record.options.interactive) poke(); });
    listen('keydown', event => {
      if (record.options.interactive && !event.repeat && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); poke(); }
    });
    listen('pointermove', event => {
      if (!record.options.interactive || event.pointerType === 'touch' || record.options.paused || shared.reduced || shared.lost || record.options.state === 'sleeping') return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      sim.setPointer((event.clientX - rect.left - rect.width / 2) / (rect.width * .55), (event.clientY - rect.top - rect.height * .57) / (rect.height * .75), .75);
    });
    listen('pointerleave', () => sim.setPointer(0, 0, 0));
    listen('blur', () => sim.setPointer(0, 0, 0));

    function update(partialOptions) {
      alive();
      const previous = record.options, config = optionsWith(partialOptions, previous);
      record.options = config;
      record.failed = false;
      if (config.state !== previous.state) {
        sim.setState(config.state, config.paused || shared.reduced || config.speed === 0);
        if (config.paused || shared.reduced || config.speed === 0) sim.pose = CatMotion.restPose(config.state);
      }
      if (config.cat !== previous.cat || !config.interactive || config.paused) sim.setPointer(0, 0, 0);
      resetClock(record); record.dirty = true;
      labelCanvas(); dimensions(record);
      if (!shared.intersectionObserver) record.visible = inViewport(record);
      schedule(shared);
    }

    function renderImage(imageOptions = {}) {
      alive();
      if (!imageOptions || typeof imageOptions !== 'object' || Array.isArray(imageOptions)) throw new TypeError('renderImage options must be an object.');
      const cat = imageOptions.cat ?? record.options.cat;
      const state = imageOptions.state ?? record.options.state;
      const size = imageOptions.size ?? 320;
      if (!catalog.has(cat)) throw new RangeError(`Unknown cat: ${String(cat)}.`);
      if (!states.has(state)) throw new RangeError(`Unknown avatar state: ${String(state)}.`);
      positiveSize(size, 4096, 'image size');
      if (shared.lost || !shared.renderer) throw new Error('The graphics context is recovering. Please retry after it is restored.');
      try {
        const pose = CatMotion.restPose(state);
        pose.yaw = -.04; pose.pitch = .025; pose.roll = 0;
        const source = shared.renderer.exportCanvas(pose, cat, size);
        const image = document.createElement('canvas'); image.width = image.height = size;
        const imageContext = image.getContext('2d');
        if (!imageContext) throw new Error('Cannot allocate the avatar image canvas.');
        copyFramed(imageContext, source, size);
        return image;
      } catch (error) { throw notifyError(record, error); }
    }

    async function exportPNG(exportOptions = {}) {
      alive();
      if (!exportOptions || typeof exportOptions !== 'object' || Array.isArray(exportOptions)) throw new TypeError('exportPNG options must be an object.');
      const size = positiveSize(exportOptions.size ?? 1024, 4096, 'PNG size');
      const image = renderImage({ size });
      try {
        const imageContext = image.getContext('2d');
        const pixels = imageContext.getImageData(0, 0, size, size).data;
        let left = size, top = size, right = -1, bottom = -1;
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          if (pixels[(y * size + x) * 4 + 3] > 0) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
        }
        if (right < left || bottom < top) throw new Error('The avatar image is empty. Please retry after the graphics context is ready.');
        const width = right - left + 1, height = bottom - top + 1, zoom = size * .84 / Math.max(width, height);
        const output = document.createElement('canvas'); output.width = output.height = size;
        const outputContext = output.getContext('2d');
        if (!outputContext) throw new Error('Cannot allocate the PNG canvas.');
        outputContext.drawImage(image, left, top, width, height, (size - width * zoom) / 2, (size - height * zoom) / 2, width * zoom, height * zoom);
        return await new Promise((resolve, reject) => {
          if (output.toBlob) output.toBlob(blob => blob ? resolve(blob) : reject(new Error('Cannot encode the avatar PNG.')), 'image/png');
          else {
            try {
              const binary = shared.view.atob(output.toDataURL('image/png').split(',')[1]);
              const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
              resolve(new shared.view.Blob([bytes], { type: 'image/png' }));
            } catch (error) { reject(error); }
          }
        });
      } catch (error) { throw notifyError(record, error); }
    }

    function destroy() {
      if (record.destroyed) return;
      record.destroyed = true;
      for (const cleanup of record.cleanups) cleanup();
      shared.resizeObserver?.unobserve(canvas);
      shared.intersectionObserver?.unobserve(canvas);
      shared.records.delete(record);
      canvas.remove(); canvas.width = canvas.height = 1;
      releasePool(shared);
    }

    try {
      labelCanvas(); target.appendChild(canvas); shared.records.add(record);
      dimensions(record); record.visible = inViewport(record);
      shared.resizeObserver?.observe(canvas);
      shared.intersectionObserver?.observe(canvas);
      fitSharedCanvas(shared, record);
      // A paused, detached, or offscreen mount still starts with a useful image.
      drawRecord(record);
      schedule(shared);
    } catch (error) {
      notifyError(record, error); destroy(); throw error;
    }
    return Object.freeze({ canvas, update, poke, exportPNG, renderImage, destroy });
  }

  return Object.freeze({ cats, createAvatar });
})();
