const innerLeft = new Path2D('M20.8 17.4 Q20.2 14.9 22.5 16.9 L32.7 27.3 Q34.5 29.7 31.4 29.5 L22.8 32.8 Q20.8 33.1 20.8 30.5 Z');
const innerRight = new Path2D('M79.2 17.4 Q79.8 14.9 77.5 16.9 L67.3 27.3 Q65.5 29.7 68.6 29.5 L77.2 32.8 Q79.2 33.1 79.2 30.5 Z');
function drawInnerEars(ctx, cfg) {
  ctx.save();
  const pink = ctx.createLinearGradient(18, 14, 34, 34);
  pink.addColorStop(0, '#efc7b3');
  pink.addColorStop(0.5, '#dcaa94');
  pink.addColorStop(1, '#f3d2b8');
  ctx.globalAlpha = 0.79;
  ctx.fillStyle = pink;
  ctx.fill(innerLeft);
  ctx.fill(innerRight);
  ctx.restore();
}
function drawFace(ctx, pose, cfg) {
  const [idle, play, sleep] = pose.w;
  const at = (x, y, fn) => {
    const q = onSphere(x, y, pose.yaw, pose.pitch);
    if (q.z <= 0.025) return;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, q.z * 6);
    ctx.translate(q.x, q.y);
    ctx.scale(Math.max(.02, q.sx), Math.max(.02, q.sy));
    fn();
    ctx.restore();
  };
  // The cheeks and eyes are procedural paths, without bitmap assets.
  for (const side of [-1, 1]) {
    at(side * 20, 9.3, () => {
      const cheek = ctx.createRadialGradient(0, 0, .2, 0, 0, 5.8);
      cheek.addColorStop(0, 'rgba(226,119,94,.24)');
      cheek.addColorStop(1, 'rgba(226,119,94,0)');
      ctx.fillStyle = cheek;
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.8, -.1 * side, 0, Math.PI * 2); ctx.fill();
    });
    const lid = side < 0 ? pose.blinkL : pose.blinkR;
    const happy = play * pose.laugh;
    const openness = Math.max(0, (1 - sleep) * (1 - happy) * pose.eyeOpen * (1 - lid));
    const dx = pose.lookX * .56 * (1 - sleep);
    const dy = pose.lookY * .5 * (1 - sleep);
    at(side * 12 + dx, dy, () => {
      if (openness > .14) {
        const ry = 5.25 * openness + .3;
        const eye = ctx.createLinearGradient(-3, -ry, 4, ry);
        eye.addColorStop(0, '#534d46'); eye.addColorStop(.4, '#302d2a'); eye.addColorStop(1, '#272524');
        ctx.fillStyle = eye;
        ctx.beginPath(); ctx.ellipse(0, 0, 3.6, ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha *= Math.max(0, (openness - .25) / .75);
        ctx.fillStyle = 'rgba(255,255,247,.8)';
        ctx.beginPath(); ctx.ellipse(-1, -ry * .45, .78, 1.2 * openness, -.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,211,.13)';
        ctx.beginPath(); ctx.ellipse(.6, ry * .6, 1.6, .65, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = '#4c4037'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(0, sleep > .4 ? 3.2 : -3.1, 4, 0); ctx.stroke();
      }
    });
  }
  at(pose.lookX * .15, 8.2 + pose.lookY * .15, () => {
    const nose = ctx.createLinearGradient(0, -2.7, 0, 1.2);
    nose.addColorStop(0, '#c27d6b'); nose.addColorStop(1, '#a66b60');
    ctx.fillStyle = nose;
    ctx.beginPath(); ctx.moveTo(-2.1, -1.5); ctx.quadraticCurveTo(0, -2.5, 2.1, -1.5);
    ctx.quadraticCurveTo(2.8, -.9, 1.7, .25); ctx.quadraticCurveTo(0, 2.1, -1.7, .25);
    ctx.quadraticCurveTo(-2.8, -.9, -2.1, -1.5); ctx.fill();
    ctx.strokeStyle = '#765b4b'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(0, 1.2); ctx.lineTo(0, 3);
    ctx.bezierCurveTo(-.5, 6, -3.4, 5.8, -4.3, 4.1);
    ctx.moveTo(0, 3); ctx.bezierCurveTo(.5, 6, 3.4, 5.8, 4.3, 4.1); ctx.stroke();
  });
}
