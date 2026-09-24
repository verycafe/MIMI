/*
Derived from bot-avatars, MIT © Jakub Antalik.
Adapted for Mimi: custom cat face, satin plastic, higher-resolution shading.
Full license: ../LICENSE
*/
window.CatPlastic = (() => {
'use strict';
const { parseColor } = window.CatColor;
const PAD = 3;
const SPAN = 100 + 2 * PAD;
const M = 96;
const MATCAP_SIZE = M;
const MM = M * M;
const CONIC_STOPS = 24;
const INF = 1e12;
const EL = 48 * Math.PI / 180;
const E_XY = Math.cos(EL), E_Z = Math.sin(EL);
const SLICES = 17;
const profile = (z, cap)=>cap + (1 - cap) * Math.sqrt(Math.max(0, 1 - z * z));
function edt1d(f, n, d, s, v, z) {
    let k = 0;
    v[0] = 0;
    z[0] = -1e30;
    z[1] = 1e30;
    for(let q = 1; q < n; q++){
        let x = 0;
        for(;;){
            const vk = v[k];
            x = (f[q] + q * q - f[vk] - vk * vk) / (2 * (q - vk));
            if (x > z[k]) break;
            k--;
        }
        k++;
        v[k] = q;
        z[k] = x;
        z[k + 1] = 1e30;
    }
    k = 0;
    for(let q = 0; q < n; q++){
        while(z[k + 1] < q)k++;
        const vk = v[k];
        d[q] = (q - vk) * (q - vk) + f[vk];
        s[q] = vk;
    }
}
function edt2d(mask, site, N, out, near) {
    const f = new Float32Array(N), d = new Float32Array(N), s = new Int32Array(N), v = new Int32Array(N), z = new Float32Array(N + 1);
    const g = new Float32Array(N * N), row = new Int32Array(N * N);
    for(let x = 0; x < N; x++){
        for(let y = 0; y < N; y++)f[y] = mask[y * N + x] === site ? 0 : INF;
        edt1d(f, N, d, s, v, z);
        for(let y = 0; y < N; y++){
            g[y * N + x] = d[y];
            row[y * N + x] = s[y];
        }
    }
    for(let y = 0; y < N; y++){
        const o = y * N;
        for(let x = 0; x < N; x++)f[x] = g[o + x];
        edt1d(f, N, d, s, v, z);
        for(let x = 0; x < N; x++){
            out[o + x] = d[x];
            if (near) near[o + x] = row[o + s[x]] * N + s[x];
        }
    }
}
function blur5(a, N, tmp) {
    for(let y = 0; y < N; y++){
        const o = y * N;
        for(let x = 0; x < N; x++){
            const x0 = x < 2 ? 0 : x - 2, x1 = x < 1 ? 0 : x - 1, x3 = x > N - 2 ? N - 1 : x + 1, x4 = x > N - 3 ? N - 1 : x + 2;
            tmp[o + x] = (a[o + x0] + 4 * a[o + x1] + 6 * a[o + x] + 4 * a[o + x3] + a[o + x4]) * 0.0625;
        }
    }
    for(let x = 0; x < N; x++){
        for(let y = 0; y < N; y++){
            const y0 = y < 2 ? 0 : y - 2, y1 = y < 1 ? 0 : y - 1, y3 = y > N - 2 ? N - 1 : y + 1, y4 = y > N - 3 ? N - 1 : y + 2;
            a[y * N + x] = (tmp[y0 * N + x] + 4 * tmp[y1 * N + x] + 6 * tmp[y * N + x] + 4 * tmp[y3 * N + x] + tmp[y4 * N + x]) * 0.0625;
        }
    }
}
function poisson(cov, N, u) {
    const levels = [];
    for(let n = N, f = 1; f <= 4 && n % 2 === 0 || f === 1; n >>= 1, f <<= 1){
        const mask = new Uint8Array(n * n);
        for(let y = 0; y < n; y++){
            for(let x = 0; x < n; x++){
                let sum = 0;
                for(let j = 0; j < f; j++)for(let i = 0; i < f; i++)sum += cov[(y * f + j) * N + x * f + i];
                mask[y * n + x] = sum >= 128 * f * f ? 1 : 0;
            }
        }
        levels.push({
            n,
            mask,
            phi: new Float32Array(n * n)
        });
        if (f === 4) break;
    }
    const sweep = (L, s, iters, om)=>{
        const { n, mask, phi } = L, s2 = s * s;
        for(let it = 0; it < iters; it++){
            for(let y = 1; y < n - 1; y++){
                const o = y * n;
                for(let x = 1; x < n - 1; x++){
                    const i = o + x;
                    if (!mask[i]) continue;
                    const v = (phi[i - 1] + phi[i + 1] + phi[i - n] + phi[i + n] + s2) * 0.25;
                    phi[i] += om * (v - phi[i]);
                }
            }
        }
    };
    for(let l = levels.length - 1; l >= 0; l--){
        const L = levels[l], f = 1 << l;
        if (l < levels.length - 1) {
            const C = levels[l + 1], n = L.n, cn = C.n;
            for(let y = 0; y < n; y++){
                const fy = Math.min(cn - 1, Math.max(0, (y + 0.5) / 2 - 0.5)), y0 = fy | 0, y1 = Math.min(cn - 1, y0 + 1), ty = fy - y0;
                for(let x = 0; x < n; x++){
                    const i = y * n + x;
                    if (!L.mask[i]) continue;
                    const fx = Math.min(cn - 1, Math.max(0, (x + 0.5) / 2 - 0.5)), x0 = fx | 0, x1 = Math.min(cn - 1, x0 + 1), tx = fx - x0;
                    L.phi[i] = (C.phi[y0 * cn + x0] * (1 - tx) + C.phi[y0 * cn + x1] * tx) * (1 - ty) + (C.phi[y1 * cn + x0] * (1 - tx) + C.phi[y1 * cn + x1] * tx) * ty;
                }
            }
        }
        const om = Math.min(1.9, 2 / (1 + Math.sin(Math.PI / L.n)) - 0.05);
        sweep(L, u * f, 4, 1);
        sweep(L, u * f, l === 2 ? 100 : l === 1 ? 30 : 16, om);
        sweep(L, u * f, 8, 1);
    }
    return levels[0].phi;
}
const DX = [
    1,
    1,
    0,
    -1,
    -1,
    -1,
    0,
    1
], DY = [
    0,
    1,
    1,
    1,
    0,
    -1,
    -1,
    -1
];
const DL = [
    1,
    Math.SQRT2,
    1,
    Math.SQRT2,
    1,
    Math.SQRT2,
    1,
    Math.SQRT2
];
function buildForm(cov, N, halfDepth) {
    const u = SPAN / N, NN = N * N;
    const mask = new Uint8Array(NN);
    for(let i = 0; i < NN; i++)mask[i] = cov[i] >= 128 ? 1 : 0;
    const dIn = new Float32Array(NN), dOut = new Float32Array(NN), nearIn = new Int32Array(NN);
    edt2d(mask, 0, N, dIn, null);
    edt2d(mask, 1, N, dOut, nearIn);
    const sd = new Float32Array(NN), tmp = new Float32Array(NN);
    for(let i = 0; i < NN; i++){
        const a = cov[i] / 255;
        sd[i] = u * (a > 0 && a < 1 ? a - 0.5 : mask[i] ? Math.sqrt(dIn[i]) - 0.5 : 0.5 - Math.sqrt(dOut[i]));
    }
    blur5(sd, N, tmp);
    blur5(sd, N, tmp);
    const phi = poisson(cov, N, u);
    let phiMax = 0;
    for(let i = 0; i < NN; i++)if (phi[i] > phiMax) phiMax = phi[i];
    const rIn = 2 * Math.sqrt(phiMax);
    const hMax = Math.min(0.9 * halfDepth + 0.12 * rIn, 1.2 * rIn);
    const kh = phiMax > 0 ? hMax / Math.sqrt(phiMax) : 0;
    const h = new Float32Array(NN);
    for(let i = 0; i < NN; i++)h[i] = phi[i] > 0 ? kh * Math.sqrt(phi[i]) : 0;
    blur5(h, N, tmp);
    const form = {
        N,
        i00: new Uint16Array(NN),
        wx: new Uint8Array(NN),
        wy: new Uint8Array(NN),
        ao: new Uint8Array(NN)
    };
    const { i00, wx, wy, ao } = form;
    const STEPS = N <= 64 ? [
        1,
        2,
        3,
        5,
        8
    ] : N <= 96 ? [
        1,
        2,
        4,
        7,
        11
    ] : [
        1,
        2,
        4,
        7,
        11,
        15
    ];
    const halo = 9;
    const last = N - 1;
    for(let y = 0; y < N; y++){
        for(let x = 0; x < N; x++){
            const i = y * N + x;
            const src = mask[i] ? i : dOut[i] <= halo ? nearIn[i] : -1;
            if (src < 0) continue;
            const sx = src % N, sy = (src - sx) / N;
            const xl = sx > 0 ? sx - 1 : 0, xr = sx < last ? sx + 1 : last, yu = sy > 0 ? sy - 1 : 0, yd = sy < last ? sy + 1 : last;
            let nx = -(h[sy * N + xr] - h[sy * N + xl]) / (2 * u);
            let ny = -(h[yd * N + sx] - h[yu * N + sx]) / (2 * u);
            let nz = 1;
            let len = Math.sqrt(nx * nx + ny * ny + 1);
            nx /= len;
            ny /= len;
            nz /= len;
            const dd = Math.max(0, sd[src]);
            if (dd < 2) {
                let gx = sd[sy * N + xr] - sd[sy * N + xl], gy = sd[yd * N + sx] - sd[yu * N + sx];
                const gl = Math.hypot(gx, gy) || 1;
                gx /= gl;
                gy /= gl;
                const w = 0.7 * (1 - dd / 2);
                nx += w * (-gx - nx);
                ny += w * (-gy - ny);
                nz += w * (0 - nz);
                len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                nx /= len;
                ny /= len;
                nz /= len;
            }
            const h0 = h[src];
            let occ = 0;
            for(let d = 0; d < 8; d++){
                let m = 0;
                for(let k = 0; k < STEPS.length; k++){
                    const r = STEPS[k];
                    let qx = sx + DX[d] * r, qy = sy + DY[d] * r;
                    if (qx < 0) qx = 0;
                    else if (qx > last) qx = last;
                    if (qy < 0) qy = 0;
                    else if (qy > last) qy = last;
                    const t = (h[qy * N + qx] - h0) / (r * u * DL[d]);
                    if (t > m) m = t;
                }
                occ += m / Math.sqrt(1 + m * m);
            }
            const e = 1 - Math.min(1, dd / 3);
            const edge = 1 - 0.2 * e * e;
            const aoLin = Math.pow(1 - 0.9 * occ / 8, 1.5) * edge;
            ao[i] = Math.max(1, Math.round(255 * Math.pow(aoLin, 1 / 2.2)));
            const fx = (nx * 0.5 + 0.5) * (M - 1), fy = (ny * 0.5 + 0.5) * (M - 1);
            const cx = Math.min(M - 2, Math.max(0, fx | 0)), cy = Math.min(M - 2, Math.max(0, fy | 0));
            i00[i] = cy * M + cx;
            wx[i] = Math.round(255 * Math.min(1, Math.max(0, fx - cx)));
            wy[i] = Math.round(255 * Math.min(1, Math.max(0, fy - cy)));
        }
    }
    return form;
}
function makeCanvas(n) {
    if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(n, n);
    if (typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        c.width = c.height = n;
        return c;
    }
    return null;
}
function ctx2d(c, readBack) {
    return c.getContext('2d', readBack ? {
        willReadFrequently: true
    } : undefined);
}
function rasterize(path, N) {
    const c = makeCanvas(N);
    const g = c && ctx2d(c, true);
    if (!g) return null;
    const u = SPAN / N;
    g.setTransform(1 / u, 0, 0, 1 / u, PAD / u, PAD / u);
    g.fillStyle = '#fff';
    g.fill(path);
    const px = g.getImageData(0, 0, N, N).data;
    const cov = new Uint8ClampedArray(N * N);
    for(let i = 0; i < N * N; i++)cov[i] = px[i * 4 + 3];
    return cov;
}
const forms = new Map();
const pending = new Set();
const pathIds = new WeakMap();
let nextPathId = 0;
function pathId(p) {
    let id = pathIds.get(p);
    if (!id) pathIds.set(p, id = `p${nextPathId++}`);
    return id;
}
const queue = [];
let scheduled = false;
function pump() {
    scheduled = false;
    const fn = queue.shift();
    if (fn) fn();
    if (queue.length) schedule();
}
function schedule() {
    if (scheduled) return;
    scheduled = true;
    const ric = globalThis.requestIdleCallback;
    if (ric) ric(pump, {
        timeout: 120
    });
    else setTimeout(pump, 16);
}
function idle(fn) {
    queue.push(fn);
    schedule();
}
function formFor(key, path, N, halfDepth, sync) {
    const id = `${key}|${N}|${Math.round(halfDepth)}`;
    const hit = forms.get(id);
    if (hit) return hit;
    const build = ()=>{
        pending.delete(id);
        if (forms.has(id)) return;
        const cov = rasterize(path, N);
        if (!cov) return;
        if (forms.size >= 48) forms.clear();
        forms.set(id, buildForm(cov, N, halfDepth));
    };
    if (sync) {
        build();
        return forms.get(id) ?? null;
    }
    if (!pending.has(id)) {
        pending.add(id);
        idle(build);
    }
    return null;
}
function warmPlastic(key, path, devicePx = 192, depth = 0.65) {
    formFor(key, path, tierFor(devicePx), 15 * depth, true);
}
function tierFor(devicePx) {
    return devicePx <= 100 ? 64 : devicePx <= 224 ? 128 : 256;
}
const toLin = (v)=>v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const linCache = new Map();
function linearColor(color) {
    let c = linCache.get(color);
    if (!c) {
        let rgb = parseColor(color);
        if (!rgb) {
            const cv = makeCanvas(1);
            const g = cv && ctx2d(cv, true);
            if (g) {
                g.fillStyle = color;
                g.fillRect(0, 0, 1, 1);
                const p = g.getImageData(0, 0, 1, 1).data;
                rgb = [
                    p[0],
                    p[1],
                    p[2]
                ];
            } else rgb = [
                128,
                128,
                128
            ];
        }
        c = [
            toLin(rgb[0] / 255),
            toLin(rgb[1] / 255),
            toLin(rgb[2] / 255)
        ];
        if (linCache.size > 200) linCache.clear();
        linCache.set(color, c);
    }
    return c;
}
const TONE_N = 2048, TONE_MAX = 2.5, TONE_SCALE = TONE_N / TONE_MAX;
const toneLut = new Float32Array(TONE_N);
for(let i = 0; i < TONE_N; i++){
    const v = (i + 0.5) / TONE_SCALE;
    const y = v <= 0.75 ? v : 0.75 + 0.25 * (1 - Math.exp(-(v - 0.75) / 0.25));
    toneLut[i] = 255 * (y <= 0.0031308 ? 12.92 * y : 1.055 * Math.pow(y, 1 / 2.4) - 0.055);
}
const tone = (v)=>toneLut[v <= 0 ? 0 : v >= TONE_MAX ? TONE_N - 1 : v * TONE_SCALE | 0];
const POW_N = 1024;
const powLuts = new Map();
function powLut(e) {
    let t = powLuts.get(e);
    if (!t) {
        t = new Float32Array(POW_N + 1);
        for(let i = 0; i <= POW_N; i++)t[i] = Math.pow(i / POW_N, e);
        if (powLuts.size > 16) powLuts.clear();
        powLuts.set(e, t);
    }
    return t;
}
const ENV = [
    0.92,
    0.96,
    1.0
];
const WARM = [
    1,
    0.98,
    0.95
];
const smooth = (a, b, v)=>{
    const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a);
    return t * t * (3 - 2 * t);
};
const soft = (w, s, x)=>1 - smooth(w - s, w + s, x);
function buildMatcap(out, c, f, p) {
    const { L, V, H, U, W, A, B } = f;
    const mx = Math.max(c[0], c[1], c[2], 0.05);
    const tint = [
        c[0] / mx,
        c[1] / mx,
        c[2] / mx
    ];
    const amb = Math.max(0.03, 0.57 - 0.08 * p.shadow);
    const wrap = 0.15 + 0.14 * p.spread;
    const kd = 0.62;
    const e1 = Math.min(90, Math.round(110 / Math.pow(p.spread, 1.3))), e2 = Math.max(2, Math.round(8 / p.spread));
    const lut1 = powLut(e1), lut2 = powLut(e2);
    const ks1 = 0.32 * p.highlight, ks2 = 0.10 * p.highlight, winK = 0.018 * p.highlight, rimK = 0.095 * p.rim;
    const ambT = [
        amb,
        amb,
        amb
    ];
    for(let j = 0; j < M; j++){
        for(let i = 0; i < M; i++){
            let nx = i / (M - 1) * 2 - 1, ny = j / (M - 1) * 2 - 1;
            let r2 = nx * nx + ny * ny;
            if (r2 > 1.14) continue;
            if (r2 > 1) {
                const s = 1 / Math.sqrt(r2);
                nx *= s;
                ny *= s;
                r2 = 1;
            }
            const nz = Math.sqrt(1 - r2);
            const nl = nx * L[0] + ny * L[1] + nz * L[2];
            const nv = Math.max(0, nx * V[0] + ny * V[1] + nz * V[2]);
            const nh = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
            const dif = Math.min(1, Math.max(0, (nl + wrap) / (1 + wrap)));
            const q = 1 - nv, q2 = q * q, f3 = q2 * q, f5 = f3 * q2;
            const ni = nh * POW_N | 0;
            const spec = (ks1 * lut1[ni] + ks2 * lut2[ni]) * (1 + 0.5 * f5);
            const rx = 2 * nv * nx - V[0], ry = 2 * nv * ny - V[1], rz = 2 * nv * nz - V[2];
            const sky = 0.45 + 0.55 * smooth(-0.4, 0.6, rx * U[0] + ry * U[1] + rz * U[2]);
            const rw = rx * W[0] + ry * W[1] + rz * W[2];
            let win = 0;
            if (rw > 0.5) {
                const ra = (rx * A[0] + ry * A[1] + rz * A[2]) / rw, rb = (rx * B[0] + ry * B[1] + rz * B[2]) / rw;
                win = soft(0.34, 0.12, Math.abs(ra)) * soft(0.12, 0.06, Math.abs(rb));
            }
            const env = rimK * f3 * sky + winK * win;
            const k = (j * M + i) * 3;
            out[k] = tone(c[0] * (ambT[0] + kd * dif) + spec * WARM[0] + env * ENV[0]);
            out[k + 1] = tone(c[1] * (ambT[1] + kd * dif) + spec * WARM[1] + env * ENV[1]);
            out[k + 2] = tone(c[2] * (ambT[2] + kd * dif) + spec * WARM[2] + env * ENV[2]);
        }
    }
}
function sampleMatcap(mc, nx, ny, out) {
    const fx = (nx * 0.5 + 0.5) * (M - 1), fy = (ny * 0.5 + 0.5) * (M - 1);
    const cx = Math.min(M - 2, Math.max(0, fx | 0)), cy = Math.min(M - 2, Math.max(0, fy | 0));
    const x = fx - cx, y = fy - cy, b = (cy * M + cx) * 3, R = M * 3;
    const w00 = (1 - x) * (1 - y), w10 = x * (1 - y), w01 = (1 - x) * y, w11 = x * y;
    for(let ch = 0; ch < 3; ch++)out[ch] = mc[b + ch] * w00 + mc[b + 3 + ch] * w10 + mc[b + R + ch] * w01 + mc[b + R + 3 + ch] * w11;
}
function shadeTexels(form, mc, px, aoMul) {
    const { N, i00, wx, wy, ao } = form;
    const R = M * 3;
    for(let i = 0, k = 0; i < N * N; i++, k += 4){
        const a = ao[i];
        if (a === 0) {
            px[k + 3] = 0;
            continue;
        }
        const m = aoMul[a];
        const b = i00[i] * 3, x = wx[i] * (1 / 255), y = wy[i] * (1 / 255);
        const w00 = (1 - x) * (1 - y) * m, w10 = x * (1 - y) * m, w01 = (1 - x) * y * m, w11 = x * y * m;
        px[k] = mc[b] * w00 + mc[b + 3] * w10 + mc[b + R] * w01 + mc[b + R + 3] * w11;
        px[k + 1] = mc[b + 1] * w00 + mc[b + 4] * w10 + mc[b + R + 1] * w01 + mc[b + R + 4] * w11;
        px[k + 2] = mc[b + 2] * w00 + mc[b + 5] * w10 + mc[b + R + 2] * w01 + mc[b + R + 5] * w11;
        px[k + 3] = 255;
    }
}
const norm3 = (v)=>{
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [
        v[0] / l,
        v[1] / l,
        v[2] / l
    ];
};
function capFrame(r) {
    const cr = Math.cos(r.roll), sr = Math.sin(r.roll);
    const lx = cr * r.lx + sr * r.ly, ly = -sr * r.lx + cr * r.ly;
    const mirror = r.facing < 0 ? -1 : 1;
    const zf = mirror * Math.min(1, Math.abs(r.facing) / 0.16);
    const { cy, sy, cp, sp } = r;
    const local = (x, y, z, zk = zf)=>norm3([
            cy * x + sy * sp * y - sy * cp * z,
            cp * y + sp * z,
            zk * (sy * x - cy * sp * y + cy * cp * z)
        ]);
    const L = local(E_XY * lx, E_XY * ly, E_Z);
    const V = local(0, 0, 1, mirror);
    const H = norm3([
        L[0] + V[0],
        L[1] + V[1],
        L[2] + V[2]
    ]);
    const U = local(lx, ly, 0, mirror);
    const cw = Math.cos(80 * Math.PI / 180), sw = Math.sin(80 * Math.PI / 180);
    const wx = cw * lx - sw * ly, wy = sw * lx + cw * ly;
    const Ws = norm3([
        0.55 * wx,
        0.55 * wy,
        0.83
    ]);
    const As = norm3([
        Ws[1],
        -Ws[0],
        0
    ]);
    const Bs = [
        Ws[1] * As[2] - Ws[2] * As[1],
        Ws[2] * As[0] - Ws[0] * As[2],
        Ws[0] * As[1] - Ws[1] * As[0]
    ];
    const W = local(Ws[0], Ws[1], Ws[2], mirror), A = local(As[0], As[1], As[2], mirror), B = local(Bs[0], Bs[1], Bs[2], mirror);
    return {
        L,
        V,
        H,
        U,
        W,
        A,
        B
    };
}
const states = new WeakMap();
function stateFor(ctx, outline) {
    const key = ctx.canvas ?? ctx;
    let byOutline = states.get(key);
    if (!byOutline) {
        byOutline = new Map();
        states.set(key, byOutline);
    }
    let s = byOutline.get(outline);
    if (!s) {
        s = {
            N: 0,
            img: null,
            mc: new Float32Array(MM * 3),
            mcPrev: new Float32Array(MM * 3),
            mcMix: new Float32Array(MM * 3),
            mixVersion: 0,
            blendT: 1,
            blendFrames: 1,
            sinceBuild: 0,
            L: null,
            V: null,
            lx: NaN,
            ly: NaN,
            base: '',
            shadow: NaN,
            highlight: NaN,
            spread: NaN,
            rim: NaN,
            version: 0,
            imgVersion: -1,
            imgAoK: NaN,
            imgForm: null,
            aoK: -1,
            aoMul: new Float32Array(256),
            near: null,
            rimG: null,
            far: null,
            scratch: [
                null,
                null
            ],
            scratchIdx: 0,
            scratchN: 0,
            scratchStale: true,
            sprites: [
                null,
                null,
                null
            ],
            spriteVersion: -1,
            spritePx: 0
        };
        if (byOutline.size > 4) byOutline.clear();
        byOutline.set(outline, s);
    }
    return s;
}
const BIN = 1 / 48;
const moved = (a, b)=>!b || Math.abs(a[0] - b[0]) >= BIN || Math.abs(a[1] - b[1]) >= BIN || Math.abs(a[2] - b[2]) >= BIN;
function mulAffine(A, B) {
    return [
        A[0] * B[0] + A[2] * B[1],
        A[1] * B[0] + A[3] * B[1],
        A[0] * B[2] + A[2] * B[3],
        A[1] * B[2] + A[3] * B[3],
        A[0] * B[4] + A[2] * B[5] + A[4],
        A[1] * B[4] + A[3] * B[5] + A[5]
    ];
}
function sideGradient(ctx, mc, nz, dark, lxy) {
    const rr = Math.sqrt(1 - nz * nz), c = [
        0,
        0,
        0
    ], k = 1 - dark;
    if (typeof ctx.createConicGradient === 'function') {
        const g = ctx.createConicGradient(0, 50, 50);
        for(let s = 0; s <= CONIC_STOPS; s++){
            const phi = s / CONIC_STOPS * Math.PI * 2;
            sampleMatcap(mc, rr * Math.cos(phi), rr * Math.sin(phi), c);
            g.addColorStop(s / CONIC_STOPS, `rgb(${c[0] * k | 0} ${c[1] * k | 0} ${c[2] * k | 0})`);
        }
        return g;
    }
    const g = ctx.createLinearGradient(50 + lxy[0] * 50, 50 + lxy[1] * 50, 50 - lxy[0] * 50, 50 - lxy[1] * 50);
    const at = (nx, ny, t)=>{
        sampleMatcap(mc, nx, ny, c);
        g.addColorStop(t, `rgb(${c[0] * k | 0} ${c[1] * k | 0} ${c[2] * k | 0})`);
    };
    at(rr * lxy[0], rr * lxy[1], 0);
    at(-rr * lxy[1], rr * lxy[0], 0.5);
    at(-rr * lxy[0], -rr * lxy[1], 1);
    return g;
}
const WEBKIT = typeof navigator !== 'undefined' && /AppleWebKit\//.test(navigator.userAgent) && !/Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
const SIDE_KINDS = [
    [
        0.55,
        ()=>0
    ],
    [
        0,
        ()=>0
    ],
    [
        0,
        (m)=>Math.min(0.6, 0.25 * m.shadow)
    ]
];
function drawPlasticCap(ctx, cfg, rig, pal, union, mat) {
    const N = tierFor(rig.dev);
    const form = formFor(cfg.typeKey ?? pathId(cfg.path), cfg.path, N, rig.halfDepth, !!rig.still);
    if (!form) return false;
    const st = stateFor(ctx, cfg.typeKey ?? pathId(cfg.path));
    const f = capFrame(rig);
    const lxy = (()=>{
        const l = Math.hypot(f.L[0], f.L[1]);
        return l < 0.05 ? [
            0,
            -1
        ] : [
            f.L[0] / l,
            f.L[1] / l
        ];
    })();
    if (moved(f.L, st.L) || moved(f.V, st.V) || rig.lx !== st.lx || rig.ly !== st.ly || pal.base !== st.base || mat.shadow !== st.shadow || mat.highlight !== st.highlight || mat.spread !== st.spread || mat.rim !== st.rim) {
        if (st.version > 0) st.mcPrev.set(st.mcMix);
        buildMatcap(st.mc, linearColor(pal.base), f, mat);
        if (st.version === 0 || rig.still) {
            st.mcMix.set(st.mc);
            st.blendT = 1;
        } else {
            st.blendFrames = Math.min(10, Math.max(1, st.sinceBuild));
            st.blendT = 0;
        }
        st.sinceBuild = 0;
        st.mixVersion++;
        st.L = f.L;
        st.V = f.V;
        st.lx = rig.lx;
        st.ly = rig.ly;
        st.base = pal.base;
        st.shadow = mat.shadow;
        st.highlight = mat.highlight;
        st.spread = mat.spread;
        st.rim = mat.rim;
        st.version++;
        st.near = st.rimG = st.far = null;
    }
    st.sinceBuild++;
    if (st.blendT < 1) {
        st.blendT = Math.min(1, st.blendT + 1 / st.blendFrames);
        const e = st.blendT >= 1 ? 1 : st.blendT * st.blendT * (3 - 2 * st.blendT);
        const a = st.mcPrev, b = st.mc, o = st.mcMix;
        for(let i = 0; i < MM * 3; i++)o[i] = a[i] + (b[i] - a[i]) * e;
        st.mixVersion++;
    }
    const aoK = Math.min(1.3, 1.2 * mat.shadow);
    if (aoK !== st.aoK) {
        for(let a = 0; a < 256; a++)st.aoMul[a] = Math.max(0, 1 - aoK * (1 - a / 255));
        st.aoK = aoK;
    }
    if (!st.img || st.N !== N) {
        st.img = new ImageData(N, N);
        st.N = N;
        st.imgVersion = -1;
    }
    if (st.imgVersion !== st.mixVersion || st.imgAoK !== aoK || st.imgForm !== form) {
        shadeTexels(form, st.mcMix, st.img.data, st.aoMul);
        st.imgVersion = st.mixVersion;
        st.imgAoK = aoK;
        st.imgForm = form;
        st.scratchStale = true;
    }
    if (st.scratchN !== N) {
        st.scratch = [
            null,
            null
        ];
        st.scratchN = N;
        st.scratchStale = true;
    }
    if (st.scratchStale) {
        st.scratchIdx ^= 1;
        let sc = st.scratch[st.scratchIdx];
        if (!sc) {
            const c = makeCanvas(N);
            const g = c && ctx2d(c, false);
            if (!c || !g) return false;
            sc = st.scratch[st.scratchIdx] = {
                c,
                g
            };
        }
        sc.g.putImageData(st.img, 0, 0);
        st.scratchStale = false;
    }
    const sc = st.scratch[st.scratchIdx];
    let fast = cfg.sides === 'sprite' || cfg.sides !== 'vector' && WEBKIT;
    if (fast) {
        const px = Math.ceil(SPAN * rig.dev / 100);
        if (st.spritePx !== px) {
            st.sprites = [
                null,
                null,
                null
            ];
            st.spritePx = px;
            st.spriteVersion = -1;
        }
        if (st.spriteVersion !== st.version) {
            const k = px / SPAN;
            for(let i = 0; i < 3 && fast; i++){
                let spr = st.sprites[i];
                if (!spr) {
                    const c = makeCanvas(px);
                    const g = c && ctx2d(c, false);
                    if (!c || !g) {
                        fast = false;
                        break;
                    }
                    spr = st.sprites[i] = {
                        c,
                        g
                    };
                }
                spr.g.setTransform(1, 0, 0, 1, 0, 0);
                spr.g.clearRect(0, 0, px, px);
                spr.g.setTransform(k, 0, 0, k, PAD * k, PAD * k);
                spr.g.fillStyle = sideGradient(spr.g, st.mc, SIDE_KINDS[i][0], SIDE_KINDS[i][1](mat), lxy);
                spr.g.fill(cfg.path);
            }
            if (fast) st.spriteVersion = st.version;
        }
    }
    if (!fast && !st.near) {
        st.near = sideGradient(ctx, st.mc, 0.55, 0, lxy);
        st.rimG = sideGradient(ctx, st.mc, 0, 0, lxy);
        st.far = sideGradient(ctx, st.mc, 0, Math.min(0.6, 0.25 * mat.shadow), lxy);
    }
    const { cy, sy, cp, sp, halfDepth, cap } = rig;
    const order = rig.facing >= 0 ? 1 : -1;
    const [ca, cb, cc, cd, ce, cf] = rig.ctm;
    let fill = null;
    if (fast) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }
    let pa = 1, pb = 0, pc = 0, pd = 1, pe = 0, pf = 0;
    for(let j = 0; j < SLICES - 1; j++){
        const k = order > 0 ? j : SLICES - 1 - j;
        const z = -1 + 2 * k / (SLICES - 1);
        const s = profile(z, cap);
        const zn = z * order;
        const m0 = cy * s, m1 = sy * sp * s, m3 = cp * s;
        const e = z * sy * halfDepth - 50 * m0, fo = -z * cy * sp * halfDepth - 50 * m1 - 50 * m3;
        const det = pa * pd - pb * pc;
        const ia = pd / det, ib = -pb / det, ic = -pc / det, id = pa / det, ie = (pc * pf - pd * pe) / det, jf = (pb * pe - pa * pf) / det;
        ctx.transform(ia * m0 + ic * m1, ib * m0 + id * m1, ic * m3, id * m3, ia * e + ic * fo + ie, ib * e + id * fo + jf);
        pa = m0;
        pb = m1;
        pc = 0;
        pd = m3;
        pe = e;
        pf = fo;
        const kind = zn > 0.4 ? 0 : zn >= 0 ? 1 : 2;
        if (fast) {
            ctx.drawImage(st.sprites[kind].c, -PAD, -PAD, SPAN, SPAN);
        } else {
            const g = kind === 0 ? st.near : kind === 1 ? st.rimG : st.far;
            if (g !== fill) ctx.fillStyle = fill = g;
            ctx.fill(cfg.path);
        }
    }
    ctx.setTransform(ca, cb, cc, cd, ce, cf);
    const inv = 1 / (cy * cp);
    const dx = sy * halfDepth / cy, dy = -sp * halfDepth * inv;
    const dl = Math.hypot(dx, dy);
    const ex = dl > 1e-6 ? order * dx / dl : 1, ey = dl > 1e-6 ? order * dy / dl : 0;
    const lead = 50 * cap + Math.hypot(50 * (1 - cap), dl);
    const stretch = (lead + 50) / 100, shift = (lead - 50) / 2;
    const a = 1 + (stretch - 1) * ex * ex, b = (stretch - 1) * ex * ey, d = 1 + (stretch - 1) * ey * ey;
    const capM = mulAffine(mulAffine(rig.ctm, [
        cy,
        sy * sp,
        0,
        cp,
        0,
        0
    ]), [
        a,
        b,
        b,
        d,
        shift * ex - 50 * a - 50 * b,
        shift * ey - 50 * b - 50 * d
    ]);
    ctx.save();
    ctx.setTransform(capM[0], capM[1], capM[2], capM[3], capM[4], capM[5]);
    ctx.clip(cfg.path);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sc.c, -PAD, -PAD, SPAN, SPAN);
    ctx.restore();
    if (rig.dev >= 256 && mat.rim > 0 && mat.highlight > 0) {
        ctx.save();
        if (union) ctx.clip(union);
        else ctx.globalCompositeOperation = 'source-atop';
        ctx.setTransform(capM[0], capM[1], capM[2], capM[3], capM[4], capM[5]);
        const al = Math.min(0.5, 0.3 * mat.rim * Math.min(1.4, mat.highlight));
        const g = ctx.createLinearGradient(50 + lxy[0] * 50, 50 + lxy[1] * 50, 50 - lxy[0] * 50, 50 - lxy[1] * 50);
        g.addColorStop(0, `rgba(235,244,255,${al.toFixed(3)})`);
        g.addColorStop(0.45, `rgba(235,244,255,${(0.35 * al).toFixed(3)})`);
        g.addColorStop(0.75, 'rgba(235,244,255,0)');
        ctx.strokeStyle = g;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1.3;
        ctx.stroke(cfg.path);
        ctx.restore();
    }
    return true;
}

return { PAD, SPAN, MATCAP_SIZE, buildForm, rasterize, warmPlastic, tierFor, buildMatcap, shadeTexels, capFrame, mulAffine, drawPlasticCap };
})();
