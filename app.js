/* The showcase uses the public API included in the project. */
(() => {
  'use strict';
  const { cats: availableCats, createAvatar } = window.MimiAvatars;
  const cats = [
    ...availableCats.filter(cat => cat.id === 'black'),
    ...availableCats.filter(cat => cat.id !== 'black')
  ];
  const catalog = new Map(cats.map(cat => [cat.id, cat]));
  const $ = id => document.getElementById(id);
  const labels = { default: '正在好奇地看着你', working: '正在认真忙碌', sleeping: '嘘，小猫正在做梦' };
  const gallery = $('cat-gallery');
  const cards = new Map(), thumbnails = new Map(), controllers = [];
  let catId = 'black', state = 'default', paused = false, codeTab = 'javascript';
  let main = null, chat = null, thumbnailFrame = 0;
  let toastTimer = 0, chatTimer = 0, chatRun = 0, destroyed = false;
  let chatThinking = true, chatRemaining = 1800, chatDeadline = 0;

  function tell(message) {
    const toast = $('toast'); toast.textContent = message; toast.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
  function displayError(error) {
    console.error(error);
    $('mood-label').textContent = '头像暂时无法显示，请刷新或换用支持 WebGL 2 的浏览器。';
  }
  for (const cat of cats) {
    const card = document.createElement('button'); card.type = 'button';
    card.className = 'cat-card'; card.dataset.cat = cat.id;
    card.setAttribute('aria-label', `选择${cat.name}`);
    const visual = document.createElement('span'); visual.className = 'cat-visual';
    const image = document.createElement('img'); image.alt = ''; image.width = image.height = 320;
    image.decoding = 'async'; image.addEventListener('load', () => card.classList.add('ready'));
    image.addEventListener('error', () => card.classList.add('thumbnail-unavailable'));
    visual.append(image);
    const name = document.createElement('span'); name.className = 'cat-name'; name.textContent = cat.name;
    card.append(visual, name); gallery.append(card);
    cards.set(cat.id, card); thumbnails.set(cat.id, image);
    card.addEventListener('click', () => selectCat(cat.id));
  }

  function updateCode() {
    const script = 'script';
    const js = `<div id="cat-avatar"></div>\n<${script} src="./dist/mimi-cat-avatars.js"></${script}>\n<${script}>\n  const cat = MimiAvatars.createAvatar(\n    document.querySelector('#cat-avatar'),\n    { cat: '${catId}', state: '${state}', size: 64 }\n  );\n\n  // 任务开始时改变状态\n  cat.update({ state: 'working' });\n  // 移除头像时释放资源\n  // cat.destroy();\n</${script}>`;
    const react = `import { CatAvatar } from 'mimi-cat-avatars/react';\n\nexport default function Assistant({ busy = false }) {\n  return (\n    <CatAvatar\n      cat="${catId}"\n      state={busy ? 'working' : '${state === 'working' ? 'default' : state}'}\n      size={64}\n      interactive\n    />\n  );\n}`;
    $('integration-code').textContent = codeTab === 'react' ? react : js;
    document.querySelectorAll('[data-code-tab]').forEach(button => {
      const selected = button.dataset.codeTab === codeTab;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected) $('integration-panel').setAttribute('aria-labelledby', button.id);
    });
  }
  function updateDescription() {
    const cat = catalog.get(catId);
    $('cat-name').textContent = cat.name; $('cat-description').textContent = cat.description;
    $('cat-english').textContent = cat.english;
    const edition = $('edition-number'); if (edition) edition.textContent = `${String(cats.indexOf(cat) + 1).padStart(2, '0')} / 08`;
    document.title = `Mimi · ${cat.name}与八只纸猫`;
    document.querySelectorAll('[data-selected-cat]').forEach(el => el.textContent = cat.name);
    cards.forEach((button, id) => {
      button.classList.toggle('selected', id === catId);
      button.setAttribute('aria-pressed', String(id === catId));
    });
    if (main) main.canvas.setAttribute('aria-label', `${cat.name}，点击或按空格与它互动`);
    updateCode();
  }
  function selectCat(id) {
    if (!catalog.has(id)) return;
    catId = id;
    controllers.forEach(controller => controller.update({ cat: id, label: undefined }));
    updateDescription();
    startChatLoop();
  }
  try {
    const mount = $('avatar-mount');
    main = createAvatar(mount, {
      cat: catId, state, size: Math.max(160, Math.round(mount.clientWidth || 440)),
      label: `${catalog.get(catId).name}，点击互动`, onError: displayError,
      onFrame(pose) {
        const lift = Math.max(0, -pose.y), ground = $('ground-shadow');
        if ($('mood-label').textContent.startsWith('头像暂时无法显示')) $('mood-label').textContent = labels[state];
        ground.style.transform = `scale(${1 - Math.min(.4, lift * .012)},${1 - Math.min(.5, lift * .016)})`;
        ground.style.opacity = String(.75 - Math.min(.4, lift * .016));
      }
    });
    controllers.push(main); main.canvas.id = 'avatar';
    function showHeart() {
      if (paused) return;
      const heart = $('pet-heart'); heart.classList.remove('pop'); void heart.offsetWidth; heart.classList.add('pop');
    }
    main.canvas.addEventListener('click', showHeart);
    main.canvas.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') showHeart(); });
  } catch (error) { displayError(error); }

  const demoStates = { 'assistant-idle': 'default', 'assistant-working': 'working', 'assistant-sleeping': 'sleeping', chat: 'working' };
  document.querySelectorAll('[data-demo-avatar]').forEach(mount => {
    try {
      const key = mount.dataset.demoAvatar;
      const controller = createAvatar(mount, {
        cat: catId, state: demoStates[key], size: Number(mount.dataset.size) || 56,
        interactive: false, label: `${catalog.get(catId).name}，${labels[demoStates[key]]}`,
        onError: () => mount.classList.add('avatar-unavailable')
      });
      controllers.push(controller); if (key === 'chat') chat = controller;
    } catch { mount.classList.add('avatar-unavailable'); }
  });
  document.querySelectorAll('[data-demo-size]').forEach(mount => {
    try { controllers.push(createAvatar(mount, { cat: catId, size: Number(mount.dataset.demoSize), interactive: false })); }
    catch { mount.classList.add('avatar-unavailable'); }
  });
  function showChatPhase(thinking) {
    chatThinking = thinking;
    chatRemaining = thinking ? 1800 : 5000;
    const answer = $('chat-answer');
    answer.classList.toggle('is-thinking', thinking);
    answer.textContent = thinking ? '' : '当然。上午先完成最重要的任务，下午处理消息和零碎事项。也别忘了，给自己留一点休息的时间。';
    $('chat-status').textContent = thinking ? '正在整理' : '已回复';
    if (chat) chat.update({ state: thinking ? 'working' : 'default' });
  }
  function syncChatLoop() {
    const run = ++chatRun;
    if (chatDeadline) chatRemaining = Math.max(0, chatDeadline - performance.now());
    clearTimeout(chatTimer); chatTimer = 0; chatDeadline = 0;
    if (destroyed || paused || document.hidden) return;
    chatDeadline = performance.now() + chatRemaining;
    chatTimer = setTimeout(() => {
      if (run !== chatRun || destroyed) return;
      chatTimer = 0; chatDeadline = 0;
      showChatPhase(!chatThinking);
      syncChatLoop();
    }, chatRemaining);
  }
  function startChatLoop() {
    clearTimeout(chatTimer); chatTimer = 0; chatDeadline = 0;
    showChatPhase(true);
    syncChatLoop();
  }
  document.addEventListener('visibilitychange', syncChatLoop);

  const pendingThumbnails = [...cats];
  function nextThumbnail() {
    thumbnailFrame = 0;
    if (!main || destroyed || document.hidden) return;
    const cat = pendingThumbnails.shift(); if (!cat) return;
    try { thumbnails.get(cat.id).src = main.renderImage({ cat: cat.id, state: 'default', size: 320 }).toDataURL('image/png'); }
    catch { cards.get(cat.id).classList.add('thumbnail-unavailable'); }
    scheduleThumbnails();
  }
  function scheduleThumbnails() {
    if (!thumbnailFrame && main && pendingThumbnails.length && !destroyed && !document.hidden) thumbnailFrame = requestAnimationFrame(nextThumbnail);
  }
  document.addEventListener('visibilitychange', scheduleThumbnails);
  document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => {
    state = button.dataset.state; if (main) main.update({ state });
    $('mood-label').textContent = labels[state];
    $('sleep-marks').classList.toggle('visible', state === 'sleeping');
    document.querySelectorAll('[data-state]').forEach(el => {
      el.classList.toggle('selected', el === button); el.setAttribute('aria-pressed', String(el === button));
    });
    updateCode();
  }));
  $('pause').addEventListener('click', () => {
    paused = !paused; controllers.forEach(controller => controller.update({ paused }));
    $('pause').setAttribute('aria-pressed', String(paused));
    $('pause').setAttribute('aria-label', paused ? '继续动画' : '暂停动画');
    $('pause').title = paused ? '继续动画' : '暂停动画';
    $('pause-icon').setAttribute('d', paused ? 'M7 4l8 6-8 6Z' : 'M7 5v10M13 5v10');
    document.body.classList.toggle('paused', paused);
    syncChatLoop();
  });
  const codeTabs = [...document.querySelectorAll('[data-code-tab]')];
  codeTabs.forEach((button, index) => {
    button.addEventListener('click', () => { codeTab = button.dataset.codeTab; updateCode(); });
    button.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = (index + 1) % codeTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = codeTabs.length - 1;
      else return;
      event.preventDefault(); codeTabs[next].focus(); codeTabs[next].click();
    });
  });
  $('copy-code').addEventListener('click', async () => {
    const text = $('integration-code').textContent;
    try { await navigator.clipboard.writeText(text); tell('接入代码已复制。'); }
    catch {
      const selection = window.getSelection(), range = document.createRange();
      range.selectNodeContents($('integration-code')); selection.removeAllRanges(); selection.addRange(range);
      tell('代码已选中，请按系统复制快捷键。');
    }
  });
  const mountResize = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    if (!main) return;
    const width = Math.round(entries[0].contentRect.width); if (width > 0) main.update({ size: width });
  }) : null;
  if (mountResize) mountResize.observe($('avatar-mount'));
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    destroyed = true; clearTimeout(chatTimer); clearTimeout(toastTimer);
    cancelAnimationFrame(thumbnailFrame); if (mountResize) mountResize.disconnect();
    controllers.forEach(controller => controller.destroy());
  });
  updateDescription(); scheduleThumbnails(); startChatLoop();
})();
