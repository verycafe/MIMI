'use client';

import { useRef, useState } from 'react';
import { cats } from 'mimi-cat-avatars';
import { CatAvatar } from 'mimi-cat-avatars/react';

// Add this component to an existing React app. No renderer setup or cleanup is needed.
export default function CatCompanion() {
  const avatar = useRef(null);
  const [cat, setCat] = useState('cream');
  const [state, setState] = useState('default');
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState('');
  const name = cats.find(item => item.id === cat).name;

  return (
    <section aria-label="我的猫咪助手">
      <label>
        选择猫咪{' '}
        <select value={cat} onChange={event => setCat(event.target.value)}>
          {cats.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>

      <div style={{ minHeight: 128, display: 'flex', alignItems: 'center', gap: 16 }}>
        {visible && (
          <CatAvatar
            ref={avatar}
            cat={cat}
            state={state}
            paused={paused}
            size={112}
            label={`${name}，点击打个招呼`}
            onError={reason => setError(reason.message)}
          />
        )}
        <p>{state === 'working' ? '正在帮你想办法…' : state === 'sleeping' ? '休息一下，马上回来。' : '我在，今天想做些什么？'}</p>
      </div>

      <div aria-label="助手状态" role="group">
        {[['default', '待命'], ['working', '工作'], ['sleeping', '休眠']].map(([value, label]) => (
          <button key={value} type="button" aria-pressed={state === value} onClick={() => setState(value)}>{label}</button>
        ))}
      </div>
      <button type="button" onClick={() => avatar.current?.poke()} disabled={!visible}>打个招呼</button>
      <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? '继续动画' : '暂停动画'}</button>
      <button type="button" onClick={() => { setError(''); setVisible(value => !value); }}>{visible ? '收起头像' : '显示头像'}</button>
      {error && <p role="status">头像暂时无法显示：{error}</p>}
    </section>
  );
}
