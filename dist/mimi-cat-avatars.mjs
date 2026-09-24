/*! Mimi Cat Avatars 0.1.0
Motion engine attribution and license:
MIT License

Copyright (c) 2026 Jakub Antalik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
/*
Motion engine derived from bot-avatars, MIT © Jakub Antalik.
Used by the procedural 3D Mimi avatar.
Full license: ../LICENSE
*/
const CatMotion = (() => {
'use strict';
const STATES = [
    'default',
    'working',
    'sleeping'
];
const HOP_T = 0.68;
const HOP_SPIN_H = 26;
const FLIP_PRE = 0.2;
const FLIP_POST = 0.66;
const JUMP_DEFAULTS = {
    height: HOP_SPIN_H,
    time: HOP_T,
    stretch: 1,
    squash: 1.15,
    squashTime: 0.37,
    squashEase: 'pulse',
    groundTime: 0.11,
    groundEase: 'pulse',
    riseTime: 0.33,
    riseEase: 'pulse',
    clickSquashTime: 0.24,
    spin: 1,
    lean: 6,
    every: 8,
    land: 0
};
const flipPre = (j, poked)=>poked ? j.clickSquashTime : FLIP_PRE * j.time;
const flipDuration = (j, poked)=>flipPre(j, poked) + j.time + SQUASH_PEAK[j.squashEase] * (poked ? j.clickSquashTime : j.squashTime) + Math.max(0, j.groundTime) + j.riseTime + Math.max(0, j.land) + 0.05;
const SQUASH_PEAK = {
    sharp: 0,
    pulse: 2 / 7,
    soft: 0.5,
    bouncy: 0.144
};
const risePulse = (v, ease)=>{
    if (v <= 0) return 1;
    if (v >= 1) return 0;
    switch(ease){
        case 'sharp':
            return (1 - v) * (1 - v);
        case 'soft':
            return 0.5 + 0.5 * Math.cos(Math.PI * v);
        case 'bouncy':
            return Math.exp(-3.2 * v) * Math.cos(5.4 * v) - v * v * v * 0.026;
        default:
            {
                const k = 4.2 * v;
                return (1 + k) * Math.exp(-k) - v * v * v * 0.078;
            }
    }
};
const groundShape = (v, ease)=>1 + 0.25 * squashPulse(v, ease);
const squashPulse = (u, ease)=>{
    if (u <= 0 || u >= 1) return 0;
    let x;
    switch(ease){
        case 'sharp':
            x = (1 - u) * (1 - u);
            break;
        case 'soft':
            x = Math.sin(Math.PI * u) ** 2;
            break;
        case 'bouncy':
            x = Math.exp(-3.15 * u) * Math.sin(8.43 * u) / 0.596;
            break;
        default:
            {
                const k = 7 * u;
                x = k * k * Math.exp(2 - k) / 4;
            }
    }
    const tail = u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1;
    return x * tail * tail * (3 - 2 * tail);
};
const hopSquash = (a)=>Math.exp(-Math.pow(Math.min(Math.abs(a), Math.abs(a - 1)) / 0.11, 2));
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const SWITCH_TO = {
    default: 1.2,
    working: 0.7,
    sleeping: 1.4
};
const SWITCH_FROM_SLEEP = 1;
function rng(seed) {
    let a = seed * 0x9e3779b1 >>> 0 || 1;
    return ()=>{
        a = a + 0x6d2b79f5 >>> 0;
        let t = a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function approach(cur, target, rate, dt) {
    return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}
const easeInOut = (p)=>p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeSine = (p)=>0.5 - 0.5 * Math.cos(Math.PI * p);
class Wander {
    rand;
    amp;
    holdMin;
    holdMax;
    rate;
    spring;
    value = 0;
    vel = 0;
    target = 0;
    next = 0;
    constructor(rand, amp, holdMin, holdMax, rate, spring = false){
        this.rand = rand;
        this.amp = amp;
        this.holdMin = holdMin;
        this.holdMax = holdMax;
        this.rate = rate;
        this.spring = spring;
    }
    update(t, dt) {
        if (t >= this.next) {
            this.target = (this.rand() * 2 - 1) * this.amp;
            this.next = t + this.holdMin + this.rand() * (this.holdMax - this.holdMin);
        }
        if (this.spring) {
            const w = this.rate * 1.6, z = 0.9;
            this.vel += (w * w * (this.target - this.value) - 2 * z * w * this.vel) * dt;
            this.value += this.vel * dt;
        } else this.value = approach(this.value, this.target, this.rate, dt);
    }
    aim(v) {
        this.target = v;
        this.next = Infinity;
    }
    set(amp, holdMin, holdMax, rate) {
        this.amp = amp;
        this.holdMin = holdMin;
        this.holdMax = holdMax;
        this.rate = rate;
        this.next = 0;
    }
}
class Event {
    duration;
    p = -1;
    constructor(duration){
        this.duration = duration;
    }
    fire() {
        this.p = 0;
    }
    get active() {
        return this.p >= 0;
    }
    update(dt) {
        if (this.p < 0) return;
        this.p += dt / this.duration;
        if (this.p >= 1) this.p = -1;
    }
}
const GAZE_YAW = 35 * DEG;
const GAZE_PITCH = 14 * DEG;
const GAZE_ROLL = 3.2 * DEG;
const GAZE_HOLD_MIN = 2.6;
const GAZE_HOLD_MAX = 4.4;
const REST = {
    default: {
        pitch: 0,
        roll: 0,
        y: 0,
        lookX: 0,
        lookY: 0
    },
    working: {
        pitch: 5 * DEG,
        roll: 0,
        y: 0,
        lookX: 0,
        lookY: 0
    },
    sleeping: {
        pitch: -16 * DEG,
        roll: 6 * DEG,
        y: 3,
        lookX: 0,
        lookY: 1
    }
};
class Sim {
    pose = {
        yaw: 0,
        pitch: 0,
        roll: 0,
        x: 0,
        y: 0,
        sx: 1,
        sy: 1,
        eyeOpen: 1,
        blinkL: 0,
        blinkR: 0,
        lookX: 0,
        lookY: 0,
        breath: 0,
        laugh: 0,
        whirl: 0,
        whirlAngle: 0,
        w: [
            1,
            0,
            0
        ]
    };
    state = 'default';
    rand;
    t = 0;
    wFrom = [
        1,
        0,
        0
    ];
    tr = 1;
    trDuration = 1.2;
    yawW;
    pitchW;
    rollW;
    lookXW;
    lookYW;
    blink = new Event(0.17);
    blinkAt;
    blinkAgain = false;
    dart = new Event(0.12);
    dartAt;
    dartX = 0;
    dartY = 0;
    flip = new Event(flipDuration(JUMP_DEFAULTS, false));
    flipPoked = false;
    jump = {
        ...JUMP_DEFAULTS
    };
    flipAt;
    flipSide = 1;
    nod = new Event(1.7);
    nodAt;
    hopPhase = 0;
    hopCount = 0;
    hopGain = 0;
    laughEv = new Event(0.8);
    laughAt;
    prevYaw = 0;
    jelly = 0;
    jellyV = 0;
    gazeLead = 0;
    gazeDir = [
        0,
        0
    ];
    gazeAt = 0;
    turnK = 1;
    breathPhase = 0;
    ptrX = 0;
    ptrY = 0;
    ptrS = 0;
    ptrTargetX = 0;
    ptrTargetY = 0;
    ptrTargetS = 0;
    baseYaw = 0;
    constructor(seed, state = 'default'){
        this.rand = rng(Math.floor(seed * 1e6) + 1);
        const r = this.rand;
        this.yawW = new Wander(r, 36 * DEG, 1.1, 2.6, 3, true);
        this.pitchW = new Wander(r, 10 * DEG, 1.1, 2.6, 2.6, true);
        this.rollW = new Wander(r, 5 * DEG, 1.6, 3.2, 2, true);
        this.lookXW = new Wander(r, 3.6, 0.5, 2, 14);
        this.lookYW = new Wander(r, 2.4, 0.5, 2, 14);
        this.t = r() * 10;
        this.hopPhase = r();
        this.breathPhase = r();
        this.blinkAt = this.t + 1 + r() * 3;
        this.flipAt = this.nextFlip(this.t, 1);
        this.nodAt = this.t + 3 + r() * 4;
        this.dartAt = this.t + 1 + r() * 2;
        this.laughAt = this.t + 0.6 + r() * 1.5;
        this.setState(state, true);
    }
    setState(next, immediate = false) {
        if (next === this.state && !immediate) return;
        const from = this.state;
        this.state = next;
        const w = this.pose.w;
        if (immediate) {
            for(let i = 0; i < 3; i++)w[i] = STATES[i] === next ? 1 : 0;
            this.tr = 1;
        } else {
            this.wFrom = [
                w[0],
                w[1],
                w[2]
            ];
            this.tr = 0;
            this.trDuration = from === 'sleeping' ? SWITCH_FROM_SLEEP : SWITCH_TO[next];
        }
        switch(next){
            case 'default':
                this.yawW.set(GAZE_YAW, 2.6, 5.4, 2);
                this.pitchW.set(GAZE_PITCH, 2.8, 5.8, 1.8);
                this.rollW.set(GAZE_ROLL, 3.4, 6.6, 1.5);
                this.gazeAt = 0;
                this.gazeDir = [
                    0,
                    0
                ];
                this.lookXW.set(3.6, 0.6, 2.2, 13);
                this.lookYW.set(2.4, 0.6, 2.2, 13);
                this.flipAt = this.nextFlip(this.t, 0.6);
                break;
            case 'working':
                this.yawW.set(16 * DEG, 0.9, 1.8, 4);
                this.pitchW.set(3 * DEG, 1.2, 2.4, 3);
                this.rollW.set(0, 1, 2, 3);
                this.lookXW.set(2, 0.5, 1.2, 12);
                this.lookYW.set(1, 0.5, 1.2, 12);
                this.hopPhase = 0;
                this.hopCount = 0;
                this.laughAt = this.t + 0.5 + this.rand() * 1.2;
                break;
            case 'sleeping':
                this.yawW.set(7 * DEG, 3, 6, 0.7);
                this.pitchW.set(3 * DEG, 3, 6, 0.7);
                this.rollW.set(2 * DEG, 3, 6, 0.6);
                this.lookXW.set(0, 2, 4, 2);
                this.lookYW.set(0, 2, 4, 2);
                this.nodAt = this.t + 2.5 + this.rand() * 4;
                break;
        }
    }
    setPointer(x, y, strength) {
        this.ptrTargetX = Math.max(-1.2, Math.min(1.2, x));
        this.ptrTargetY = Math.max(-1.2, Math.min(1.2, y));
        this.ptrTargetS = Math.max(0, Math.min(1, strength));
    }
    poke() {
        if (this.flip.active && this.flip.p < 0.6) return;
        this.flipPoked = true;
        this.flip.duration = flipDuration(this.jump, true);
        this.flipSide = this.rand() < 0.5 ? -1 : 1;
        this.flip.fire();
        this.flipAt = this.nextFlip(this.t, 1.1);
    }
    setTurn(k) {
        const next = Math.max(0, k);
        if (next === this.turnK) return;
        this.turnK = next;
        if (this.state === 'default') this.gazeAt = 0;
    }
    setJump(j) {
        const every = this.jump.every;
        Object.assign(this.jump, j);
        if (j.every !== undefined && j.every !== every) this.flipAt = this.nextFlip(this.t, 1);
    }
    nextGaze() {
        const r = this.rand;
        const [px, py] = this.gazeDir;
        if (px !== 0 || py !== 0) {
            const p = r();
            if (p < 0.66) return [
                -px,
                -py
            ];
            if (p < 0.85) return [
                -px,
                py
            ];
            return [
                0,
                0
            ];
        }
        const corners = [
            [
                1,
                -1
            ],
            [
                -1,
                1
            ],
            [
                -1,
                -1
            ],
            [
                1,
                1
            ]
        ];
        return corners[Math.floor(r() * corners.length)];
    }
    nextFlip(t, k) {
        const every = this.jump.every;
        return every > 0 ? t + every * k * (0.625 + this.rand() * 0.75) : Infinity;
    }
    update(dt) {
        dt = Math.min(dt, 0.05);
        this.t += dt;
        const t = this.t;
        const p = this.pose;
        const w = p.w;
        if (this.tr < 1) {
            this.tr = Math.min(1, this.tr + dt / this.trDuration);
            const e = easeSine(this.tr);
            for(let i = 0; i < 3; i++){
                const target = STATES[i] === this.state ? 1 : 0;
                w[i] = this.wFrom[i] + (target - this.wFrom[i]) * e;
            }
        }
        const [wd, ww, ws] = w;
        const rest = {
            pitch: 0,
            roll: 0,
            y: 0,
            lookX: 0,
            lookY: 0
        };
        for(let i = 0; i < 3; i++){
            const r = REST[STATES[i]];
            rest.pitch += r.pitch * w[i];
            rest.roll += r.roll * w[i];
            rest.y += r.y * w[i];
            rest.lookX += r.lookX * w[i];
            rest.lookY += r.lookY * w[i];
        }
        if (this.state === 'default' && t >= this.gazeAt) {
            const [gx, gy] = this.nextGaze();
            this.gazeDir = [
                gx,
                gy
            ];
            const reach = 0.84 + this.rand() * 0.16;
            this.yawW.aim(gx * GAZE_YAW * reach * this.turnK);
            this.pitchW.aim(gy * GAZE_PITCH * reach);
            this.rollW.aim(gx * GAZE_ROLL * reach * this.turnK);
            this.gazeAt = t + GAZE_HOLD_MIN + this.rand() * (GAZE_HOLD_MAX - GAZE_HOLD_MIN);
        }
        this.yawW.update(t, dt);
        this.pitchW.update(t, dt);
        this.rollW.update(t, dt);
        this.lookXW.update(t, dt);
        this.lookYW.update(t, dt);
        this.ptrS = approach(this.ptrS, this.ptrTargetS, 8, dt);
        this.ptrX = approach(this.ptrX, this.ptrTargetX, 14, dt);
        this.ptrY = approach(this.ptrY, this.ptrTargetY, 14, dt);
        const ps = this.ptrS;
        const quiet = 1 - 0.75 * ps;
        this.baseYaw = approach(this.baseYaw, this.yawW.value * quiet + 22 * DEG * this.ptrX * ps, 5, dt);
        const basePitch = rest.pitch + this.pitchW.value * quiet - 12 * DEG * this.ptrY * ps;
        const baseRoll = rest.roll + this.rollW.value * quiet;
        const baseY = rest.y;
        const baseLookX = rest.lookX + this.lookXW.value * quiet + 4.5 * this.ptrX * ps;
        const baseLookY = rest.lookY + this.lookYW.value * quiet + 3 * this.ptrY * ps;
        let spin = 0, hopY = 0, sx = 1, sy = 1, pitchAdd = 0, rollAdd = 0, blinkClose = 0, lookXAdd = 0, lookYAdd = 0, laugh = 0;
        let whirl = 0, whirlAngle = 0;
        const smooth = (a, b, v)=>{
            const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
            return x * x * (3 - 2 * x);
        };
        const envelope = (q)=>smooth(0.1, 0.26, q) * (1 - smooth(0.66, 0.9, q));
        const ringAngle = (q)=>TAU * (1.5 * q + 0.9 * easeInOut(q));
        if (t >= this.blinkAt && !this.blink.active && wd + ww > 0.5) {
            this.blink.fire();
            this.blinkAgain = !this.blinkAgain && this.rand() < 0.22;
            this.blinkAt = t + (this.blinkAgain ? 0.28 : 2.2 + this.rand() * 2.6);
        }
        this.blink.update(dt);
        if (this.blink.active) blinkClose = Math.sin(Math.PI * this.blink.p);
        if (t >= this.dartAt && !this.dart.active && wd + ww > 0.5) {
            this.dart.fire();
            this.dartX = (this.rand() * 2 - 1) * 4;
            this.dartY = (this.rand() * 2 - 1) * 2;
            this.dart.duration = 0.25 + this.rand() * 0.45;
            this.dartAt = t + 1.2 + this.rand() * 2.6;
        }
        this.dart.update(dt);
        if (this.dart.active) {
            const q = this.dart.p;
            const hold = q < 0.15 ? q / 0.15 : q > 0.8 ? (1 - q) / 0.2 : 1;
            lookXAdd += this.dartX * hold * (wd + ww);
            lookYAdd += this.dartY * hold * (wd + ww);
        }
        if (this.state === 'default' && t >= this.flipAt && !this.flip.active) {
            this.flipPoked = false;
            this.flip.duration = flipDuration(this.jump, false);
            this.flipSide = this.rand() < 0.5 ? -1 : 1;
            this.flip.fire();
            this.flipAt = this.nextFlip(t, 1);
        }
        this.flip.update(dt);
        if (this.flip.active) {
            const J = this.jump;
            const preS = flipPre(J, this.flipPoked);
            const a = (this.flip.p * this.flip.duration - preS) / J.time;
            const q = Math.min(1, Math.max(0, a));
            const arc = Math.sin(Math.PI * q);
            spin += TAU * J.spin * easeInOut(q);
            hopY -= J.height * arc;
            const tl = (a - 1) * J.time - J.land;
            const squashTime = this.flipPoked ? J.clickSquashTime : J.squashTime;
            const crouch = (u)=>this.flipPoked ? u * u * (3 - 2 * u) : hopSquash(u - 1);
            const hold = Math.max(0, J.groundTime);
            const peakT = SQUASH_PEAK[J.squashEase] * squashTime;
            const rise = tl - peakT - hold;
            const depth = tl <= peakT ? squashPulse(tl / squashTime, J.squashEase) : rise <= 0 ? groundShape((tl - peakT) / hold, J.groundEase) : risePulse(rise / J.riseTime, J.riseEase);
            const land = (a < 0 ? crouch(Math.max(0, 1 + a * J.time / preS)) : tl > 0 ? depth : a < 0.2 ? hopSquash(a) : 0) * J.squash;
            sx += 0.16 * land - 0.06 * arc * J.stretch;
            sy += -0.18 * land + 0.09 * arc * J.stretch;
            rollAdd += this.flipSide * J.lean * DEG * arc;
            if (J.spin > 0) {
                laugh = Math.max(laugh, arc);
                whirl = Math.max(whirl, envelope(q));
                whirlAngle = ringAngle(q);
            }
        }
        const J = this.jump;
        const exitHold = Math.max(0, J.groundTime);
        const exitFor = exitHold + J.riseTime;
        if (this.state === 'working') this.hopGain = ww;
        if (this.hopGain > 0.02 && (this.state === 'working' || this.hopPhase > 0)) {
            this.hopPhase += dt / HOP_T;
            if (this.hopPhase >= 1) {
                if (this.state === 'working') {
                    this.hopPhase -= 1;
                    this.hopCount += 1;
                } else if ((this.hopPhase - 1) * HOP_T >= exitFor) {
                    this.hopPhase = 0;
                    this.hopGain = 0;
                }
            }
            const g = this.hopGain;
            const q = Math.min(1, this.hopPhase);
            const arc = Math.sin(Math.PI * q);
            const spinning = this.hopCount % 3 === 2;
            const h = spinning ? HOP_SPIN_H : 18;
            hopY -= h * arc * g;
            const exitT = this.state !== 'working' && this.hopPhase > 1 ? (this.hopPhase - 1) * HOP_T : -1;
            const land = exitT < 0 ? hopSquash(this.hopPhase) : exitT < exitHold ? groundShape(exitT / exitHold, J.groundEase) : risePulse((exitT - exitHold) / J.riseTime, J.riseEase);
            sx += (0.16 * land - 0.06 * arc) * g;
            sy += (-0.18 * land + 0.09 * arc) * g;
            if (spinning) {
                spin += TAU * easeInOut(q) * g;
                laugh = Math.max(laugh, arc * g);
                if (envelope(q) * g > whirl) {
                    whirl = envelope(q) * g;
                    whirlAngle = ringAngle(q);
                }
            }
            rollAdd += (this.hopCount % 2 === 0 ? 1 : -1) * 6 * DEG * arc * g;
        }
        if (this.state === 'working' && t >= this.laughAt && !this.laughEv.active) {
            this.laughEv.fire();
            this.laughEv.duration = 0.6 + this.rand() * 0.5;
            this.laughAt = t + 1.6 + this.rand() * 2.2;
        }
        this.laughEv.update(dt);
        if (this.laughEv.active) {
            const q = this.laughEv.p;
            laugh = Math.max(laugh, q < 0.18 ? q / 0.18 : q > 0.78 ? (1 - q) / 0.22 : 1);
        }
        if (this.state === 'sleeping' && t >= this.nodAt && !this.nod.active) {
            this.nod.fire();
            this.nodAt = t + 4 + this.rand() * 4;
        }
        this.nod.update(dt);
        if (this.nod.active) {
            const q = this.nod.p;
            const dip = q < 0.72 ? easeInOut(q / 0.72) : 1 - easeInOut((q - 0.72) / 0.28);
            pitchAdd -= 13 * DEG * dip * ws;
        }
        this.breathPhase += dt / (3.6 + 1.2 * ws);
        const breath = Math.sin(this.breathPhase * TAU);
        p.breath = breath;
        sx += breath * (0.008 + 0.014 * ws);
        sy += breath * (0.012 + 0.02 * ws);
        const bob = Math.sin(t * TAU / 3.4) * 2 * (1 - ws);
        p.yaw = this.baseYaw + spin;
        let dyaw = this.baseYaw - this.prevYaw;
        dyaw = ((dyaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
        this.prevYaw = this.baseYaw;
        const rate = dt > 0 ? Math.abs(dyaw) / dt : 0;
        const leadTarget = dt > 0 ? Math.max(-2.2, Math.min(2.2, dyaw / dt * 2.4)) : 0;
        this.gazeLead = approach(this.gazeLead, leadTarget, 9, dt);
        const jellyTarget = Math.min(0.22, 0.055 * rate);
        const omega = 16, zeta = 0.45;
        this.jellyV += (omega * omega * (jellyTarget - this.jelly) - 2 * zeta * omega * this.jellyV) * dt;
        this.jelly += this.jellyV * dt;
        const jelly = Math.max(-0.08, Math.min(0.28, this.jelly)) * 0.6;
        sx *= 1 + jelly;
        sy *= 1 - 0.55 * jelly;
        p.pitch = basePitch + pitchAdd;
        p.roll = baseRoll + rollAdd;
        p.x = 0;
        p.y = baseY + hopY + bob;
        p.sx = sx;
        p.sy = sy;
        p.eyeOpen = 1;
        p.laugh = approach(p.laugh, laugh, 30, dt);
        p.blinkL = blinkClose;
        p.blinkR = blinkClose;
        p.lookX = baseLookX + lookXAdd + this.gazeLead;
        p.lookY = baseLookY + lookYAdd;
        p.whirl = whirl;
        p.whirlAngle = whirlAngle;
    }
}
function restPose(state) {
    const r = REST[state];
    return {
        yaw: 0,
        pitch: r.pitch,
        roll: r.roll,
        x: 0,
        y: r.y,
        sx: 1,
        sy: 1,
        eyeOpen: 1,
        blinkL: 0,
        blinkR: 0,
        lookX: r.lookX,
        lookY: r.lookY,
        breath: 0,
        laugh: 0,
        whirl: 0,
        whirlAngle: 0,
        w: STATES.map((s)=>s === state ? 1 : 0)
    };
}

return { STATES, JUMP_DEFAULTS, Sim, restPose };
})();


/* Eight authored companions. Each has one fixed coat and one facial structure. */
const CatCatalog = Object.freeze([
  {
    id: 'american', name: '美短', english: 'AMERICAN SHORTHAIR', coatName: '银色经典虎斑',
    description: '银灰底色，深炭色额纹。宽宽的脸颊里，藏着一点机灵。',
    rgb: '147,155,155', background: '#e6e8e5', accent: '#697770',
    coat: '#b9bfc0', light: '#e6e8e2', marking: '#343a3b', secondary: '#879193',
    iris: '#9fa866', pupil: '#242c29', nose: '#bd867f', ear: '#cba8a0',
    muzzle: '#e3e5df', earCoats: ['#8e9696', '#8e9696'], pattern: 1,
    shape: { kind: 'broad', width: 1.04, height: 1.03, depth: 1, earHeight: .61, earWidth: .63, earX: .68, eyeX: .46, eyeY: .005, eyeW: .19, eyeH: .20, eyeTilt: .04, muzzleW: 1.08, muzzleDepth: .17, muzzleY: -.255 }
  },
  {
    id: 'ginger', name: '橘猫', english: 'GINGER TABBY', coatName: '暖橘条纹',
    description: '一身暖橘色，额头三道纹。像一颗刚剥开的甜橘子。',
    rgb: '219,144,56', background: '#f5dfbf', accent: '#ae7438',
    coat: '#df9b38', light: '#f0ca84', marking: '#ad632d', secondary: '#ca7c30',
    iris: '#ab8c43', pupil: '#3f2d20', nose: '#c57d73', ear: '#e1a17e',
    muzzle: '#f6dab0', earCoats: ['#d48b32', '#d48b32'], pattern: 2,
    shape: { kind: 'classic', width: 1, height: 1, depth: 1, earHeight: .76, earWidth: .63, earX: .66, eyeX: .46, eyeY: .004, eyeW: .191, eyeH: .21, eyeTilt: 0, muzzleW: 1, muzzleDepth: .20, muzzleY: -.255 }
  },
  {
    id: 'black', name: '黑猫', english: 'MIDNIGHT BLACK', coatName: '纯炭黑',
    description: '从耳尖到下巴，都是安静的炭黑。两颗金绿色眼睛亮着。',
    rgb: '67,67,71', background: '#dcded5', accent: '#66734d',
    coat: '#29292e', light: '#29292e', marking: '#29292e', secondary: '#29292e',
    iris: '#c4bd51', pupil: '#191c20', nose: '#52404a', ear: '#7c626b',
    muzzle: '#303037', earCoats: ['#27272b', '#27272b'], pattern: 0,
    shape: { kind: 'classic', width: .95, height: 1.02, depth: 1, earHeight: .83, earWidth: .61, earX: .67, eyeX: .44, eyeY: .014, eyeW: .195, eyeH: .22, eyeTilt: .06, muzzleW: .91, muzzleDepth: .19, muzzleY: -.255 }
  },
  {
    id: 'tabby', name: '虎斑猫', english: 'BROWN MACKEREL TABBY', coatName: '棕色鱼骨纹',
    description: '暖棕底色，细细的深褐条纹。尖耳朵总是先听见新动静。',
    rgb: '146,111,75', background: '#e6ddcd', accent: '#81704b',
    coat: '#9f7e51', light: '#c6ad81', marking: '#493b2c', secondary: '#6b5237',
    iris: '#8d9e59', pupil: '#2d2c20', nose: '#a87562', ear: '#bb9279',
    muzzle: '#e1cdb1', earCoats: ['#705439', '#705439'], pattern: 3,
    shape: { kind: 'wedge', width: .95, height: 1.06, depth: 1, earHeight: .80, earWidth: .62, earX: .64, eyeX: .45, eyeY: .012, eyeW: .18, eyeH: .205, eyeTilt: .09, muzzleW: .94, muzzleDepth: .22, muzzleY: -.265 }
  },
  {
    id: 'cream', name: '奶白猫', english: 'CREAM WHITE', coatName: '奶白浅奶油色',
    description: '奶白的脸颊，暖琥珀色的眼睛。安静的一小只，轻轻陪着你。',
    rgb: '220,187,137', background: '#eee2ce', accent: '#ac895a',
    coat: '#e0c094', light: '#e0c094', marking: '#e0c094', secondary: '#e0c094',
    iris: '#b57434', pupil: '#3b2c23', nose: '#ca8d87', ear: '#d9ab99',
    muzzle: '#e9cfaa', earCoats: ['#d8b78a', '#d8b78a'], pattern: 0,
    shape: { kind: 'classic', width: 1, height: 1, depth: 1, rigid: true, earHeight: .64, earWidth: .63, earX: .66, eyeX: .46, eyeY: .004, eyeW: .191, eyeH: .21, eyeTilt: 0, muzzleW: 1, muzzleDepth: .14, muzzleY: -.255 }
  },
  {
    id: 'ragdoll', name: '布偶猫', english: 'SEAL BICOLOR RAGDOLL', coatName: '海豹双色',
    description: '海豹棕耳朵，白色倒 V 脸纹。蓝眼睛被蓬松的白颊轻轻围住。',
    rgb: '153,127,113', background: '#e5e4e5', accent: '#718d9a',
    coat: '#a9907b', light: '#f5efdf', marking: '#59463f', secondary: '#cab8a1',
    iris: '#6aa6ce', pupil: '#243b52', nose: '#d39a9b', ear: '#b39491',
    muzzle: '#f6eee0', earCoats: ['#59463f', '#59463f'], pattern: 4,
    shape: { kind: 'ruff', width: 1.05, height: 1.02, depth: 1.05, earHeight: .66, earWidth: .66, earX: .67, eyeX: .46, eyeY: .025, eyeW: .184, eyeH: .214, eyeTilt: .13, muzzleW: 1, muzzleDepth: .185, muzzleY: -.255 }
  },
  {
    id: 'calico', name: '三色梨花猫', english: 'CALICO TABBY', coatName: '三花带狸花纹',
    description: '白、橘、深棕拼在一起。两边不同的花纹，是它自己的小签名。',
    rgb: '192,128,76', background: '#f1dfd4', accent: '#a77a58',
    coat: '#eee6d6', light: '#f6efdf', marking: '#473831', secondary: '#cd833b',
    iris: '#a2a568', pupil: '#352c24', nose: '#d09088', ear: '#d5a39b',
    muzzle: '#f6eada', earCoats: ['#cd833b', '#473831'], pattern: 5,
    shape: { kind: 'classic', width: 1.02, height: 1, depth: 1, earHeight: .73, earWidth: .61, earX: .68, eyeX: .46, eyeY: .008, eyeW: .19, eyeH: .211, eyeTilt: .025, muzzleW: .99, muzzleDepth: .19, muzzleY: -.255 }
  },
  {
    id: 'cow', name: '黑白奶牛猫', english: 'BLACK & WHITE', coatName: '黑白不对称斑块',
    description: '白底上落了几块黑色墨迹。一只黑耳朵，一只白耳朵，好认得很。',
    rgb: '94,100,98', background: '#e2e5de', accent: '#747e69',
    coat: '#f3eee1', light: '#f3eee1', marking: '#303238', secondary: '#303238',
    iris: '#b9b360', pupil: '#272a2a', nose: '#d6959e', ear: '#d4a5a6',
    muzzle: '#f5ecdf', earCoats: ['#303238', '#eee9dc'], pattern: 6,
    shape: { kind: 'broad', width: 1.04, height: 1, depth: 1, earHeight: .70, earWidth: .63, earX: .67, eyeX: .46, eyeY: .004, eyeW: .191, eyeH: .21, eyeTilt: 0, muzzleW: 1.04, muzzleDepth: .19, muzzleY: -.255 }
  }
].map(cat => Object.freeze({ ...cat, shape: Object.freeze(cat.shape), earCoats: Object.freeze(cat.earCoats) })));


/* Fixed, geometric coat markings for the eight CatCatalog companions.
   Inject after the main fragment shader uniforms and before its main().
   The coordinates are the head's original local positions, before animation.
   All colors are supplied in linear space, like the existing uColor uniform. */
const CatCoatShader = `
uniform int uPattern;
uniform vec3 uLightColor,uMarkColor,uSecondColor;

// Signed distances give the paint a crisp, approximately one-pixel AA edge.
// Markings change surface color only; they never add a shell or extra geometry.
float coatInside(float d){
  float aa=max(fwidth(d)*.65,.00045);
  return 1.-smoothstep(-aa,aa,d);
}
float coatAbove(float value,float edge){return coatInside(edge-value);}
float coatBelow(float value,float edge){return coatInside(value-edge);}
float coatLine(vec2 p,vec2 a,vec2 b,float radius){
  vec2 ab=b-a;
  float t=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);
  return coatInside(length(p-a-ab*t)-radius);
}
float coatBand(float value,float center,float width){
  return coatInside(abs(value-center)-width);
}
float coatForehead(vec2 p,float width){
  // The M is entirely above the eyes, occupying the original crown surface.
  float mark=coatLine(p,vec2(-.40,.265),vec2(-.29,.625),width);
  mark=max(mark,coatLine(p,vec2(-.29,.625),vec2(0.,.375),width));
  mark=max(mark,coatLine(p,vec2(0.,.375),vec2(.29,.625),width));
  mark=max(mark,coatLine(p,vec2(.29,.625),vec2(.40,.265),width));
  mark=max(mark,coatLine(p,vec2(0.,.535),vec2(0.,.82),width*.86));
  return mark;
}
float coatCheeks(vec2 p,float width,float extra){
  vec2 q=vec2(abs(p.x),p.y);
  float mark=coatLine(q,vec2(.665,-.135),vec2(1.13,-.245),width);
  mark=max(mark,coatLine(q,vec2(.635,-.315),vec2(1.04,-.465),width*.92));
  if(extra>.5){
    mark=max(mark,coatLine(q,vec2(.69,.12),vec2(1.10,.17),width*.79));
    mark=max(mark,coatLine(q,vec2(.63,-.48),vec2(.89,-.64),width*.78));
  }
  return mark;
}
float coatWrappedStripes(vec3 p,float width,float density){
  // A continuous coordinate around the sides and occiput. No repeated image map.
  float height=p.y+.075*sin(p.z*4.2)+.045*abs(p.x);
  float stripe=coatBand(height,.48,width);
  stripe=max(stripe,coatBand(height,.225,width));
  stripe=max(stripe,coatBand(height,-.04,width));
  stripe=max(stripe,coatBand(height,-.305,width));
  stripe=max(stripe,coatBand(height,-.56,width*.85));
  if(density>.5){
    stripe=max(stripe,coatBand(height,.35,width*.74));
    stripe=max(stripe,coatBand(height,.09,width*.76));
    stripe=max(stripe,coatBand(height,-.17,width*.76));
    stripe=max(stripe,coatBand(height,-.435,width*.73));
  }
  float side=max(coatAbove(abs(p.x),.80),coatBelow(p.z,.17));
  return stripe*side;
}
float coatChin(vec3 p,float width,float top){
  // A small trapezoid underneath the muzzle, never a white forehead blaze.
  float edge=width+max(0.,top-p.y)*.34;
  return coatInside(max(abs(p.x)-edge,p.y-top))*coatAbove(p.z,.18);
}

vec3 coatColor(vec3 p){
  if(uPattern==0)return uColor;
  float front=coatAbove(p.z,.26);
  vec2 face=p.xy;
  float ax=abs(p.x);

  if(uPattern==1){
    // American shorthair: silver ground, bold M, paired cheek bars and
    // the large closed flank loops of a classic/blotched tabby.
    vec3 color=mix(uColor,uLightColor,coatChin(p,.37,-.37));
    float marking=max(coatForehead(face,.047),coatCheeks(face,.044,0.))*front;
    marking=max(marking,coatLine(face,vec2(-.64,.31),vec2(-.59,.72),.038)*front);
    marking=max(marking,coatLine(face,vec2(.64,.31),vec2(.59,.72),.038)*front);
    float loop=length(vec2((p.y+.06)/.40,(p.z+.16)/.49));
    float flank=coatBand(loop,1.,.18)*coatAbove(ax,.71);
    float rear=coatBelow(p.z,.12);
    float spine=coatBand(p.x,0.,.074);
    spine=max(spine,coatBand(p.x+.08*p.y,-.30,.060));
    spine=max(spine,coatBand(p.x-.08*p.y,.30,.060));
    marking=max(marking,flank);
    marking=max(marking,spine*rear);
    return mix(color,uMarkColor,marking);
  }

  if(uPattern==2){
    // Ginger stays orange over the nose bridge; cream is confined to the chin.
    vec3 color=mix(uColor,uLightColor,coatChin(p,.27,-.465));
    float marking=max(coatForehead(face,.025),coatCheeks(face,.024,0.))*front;
    marking=max(marking,coatLine(face,vec2(-.60,.32),vec2(-.55,.70),.024)*front);
    marking=max(marking,coatLine(face,vec2(.60,.32),vec2(.55,.70),.024)*front);
    marking=max(marking,coatWrappedStripes(p,.025,0.));
    return mix(color,mix(uSecondColor,uMarkColor,.67),marking);
  }

  if(uPattern==3){
    // Brown mackerel tabby: more numerous, distinctly narrower dark lines.
    vec3 color=mix(uColor,uLightColor,coatChin(p,.31,-.405));
    float marking=max(coatForehead(face,.026),coatCheeks(face,.025,1.))*front;
    marking=max(marking,coatLine(face,vec2(-.55,.285),vec2(-.49,.70),.021)*front);
    marking=max(marking,coatLine(face,vec2(.55,.285),vec2(.49,.70),.021)*front);
    marking=max(marking,coatLine(face,vec2(-.72,.32),vec2(-.69,.64),.018)*front);
    marking=max(marking,coatLine(face,vec2(.72,.32),vec2(.69,.64),.018)*front);
    marking=max(marking,coatWrappedStripes(p,.022,1.));
    return mix(color,uMarkColor,marking);
  }

  if(uPattern==4){
    // Seal bicolor ragdoll. Both blue eyes sit in the seal mask; the white
    // inverted V starts between the brows, widening into the lower cheeks.
    vec3 color=mix(uLightColor,uSecondColor,coatBelow(p.z,.20));
    float top=p.y-(.47-.13*ax);
    float bottom=(-.29-.065*ax)-p.y;
    float mask=coatInside(max(top,bottom))*coatAbove(p.z,.02);
    float whiteV=coatInside(ax-(.030+(.405-p.y)*.69));
    float whiteCheeks=coatBelow(p.y,-.355);
    mask*=1.-max(whiteV,whiteCheeks);
    color=mix(color,uMarkColor,mask);
    // The crown above the mask remains light, including the space between ears.
    return color;
  }

  if(uPattern==5){
    // Calico tabby: two unequal, angular patches painted into a white head.
    // Extending the inequalities through z carries the patches around the back.
    vec3 color=uLightColor;
    float orangeEdge=p.x-(-.115+.34*p.y+.10*p.z);
    float orangeBottom=(-.345+.115*p.x)-p.y;
    float orange=coatInside(max(orangeEdge,orangeBottom));
    float darkEdge=(.225-.22*p.y-.18*p.z)-p.x;
    float darkBottom=(-.27+.28*p.x)-p.y;
    float dark=coatInside(max(darkEdge,darkBottom));
    // A smaller orange patch wraps the lower right rear, away from the white chin.
    float rearOrange=coatInside(max(max(.12-p.x,p.y+.27),p.z+.22));
    orange=max(orange,rearOrange);
    color=mix(color,uSecondColor,orange);
    color=mix(color,uMarkColor,dark);
    float bars=coatForehead(face,.027)*front;
    bars=max(bars,coatCheeks(face,.025,0.)*front);
    bars=max(bars,coatWrappedStripes(p,.030,0.));
    // Short tabby bars stay inside the orange pigment, without crossing white.
    return mix(color,mix(uSecondColor,uMarkColor,.76),bars*orange*(1.-dark));
  }

  if(uPattern==6){
    // Black-and-white: one large left eye patch, a smaller right crown patch,
    // and a separate back patch. The right cheek and central muzzle stay white.
    float leftEdge=p.x-(-.19-.15*p.y+.045*p.z);
    float leftBottom=(-.30+.30*(p.x+.46))-p.y;
    float left=coatInside(max(leftEdge,leftBottom));
    float rightTop=coatInside(max(max(.28-p.x,p.x-.80),(.31+.42*(p.x-.36))-p.y));
    rightTop*=coatAbove(p.z,.02);
    float rear=coatInside(max(max(.09-p.x,-.41-p.y),p.z+.23));
    float marking=max(left,max(rightTop,rear));
    return mix(uLightColor,uMarkColor,marking);
  }

  return uColor;
}
`;


/* Mimi: hand-placed low-poly geometry and procedural matte-paper shading.
   Everything in this file is generated from equations. No model, texture,
   environment image, image generation service or third-party runtime. */
const Cat3D = (() => {
  'use strict';
  const PI = Math.PI;
  const identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  const mul = (a,b) => {
    const m = new Array(16).fill(0);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) m[c*4+r] += a[k*4+r]*b[c*4+k];
    return m;
  };
  const translate = (x,y,z) => { const m=identity(); m[12]=x;m[13]=y;m[14]=z;return m; };
  const scale = (x,y,z) => [x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
  const rx = a => { const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]; };
  const ry = a => { const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]; };
  const rz = a => { const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]; };
  const norm = v => { const l=Math.hypot(...v)||1;return v.map(x=>x/l); };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const ortho = (l,r,b,t,n,f) => [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1];
  function lookAt(eye,target) {
    const z=norm(eye.map((n,i)=>n-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
    return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  }
  function hex(s) { return [1,3,5].map(i=>Math.pow(parseInt(s.slice(i,i+2),16)/255,2.2)); }
  // Deliberately placed paper folds. A polygon has one normal shared by
  // all its triangles, so triangulation never adds spurious tiny facets.
  function face(data,points,center=[0,0,0],fixedNormal=null) {
    let n=fixedNormal||norm(cross(points[1].map((v,i)=>v-points[0][i]),points[2].map((v,i)=>v-points[0][i])));
    if(!fixedNormal) {
      const mid=points[0].map((_,k)=>points.reduce((s,p)=>s+p[k],0)/points.length-center[k]);
      if(dot(n,mid)<0)n=n.map(v=>-v);
    }
    for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]])data.push(...p,...n);
  }
  const headContours = {
    classic: [[-.76,.44],[.76,.44],[1.03,-.30],[.65,-.70],[-.65,-.70],[-1.03,-.30]],
    broad: [[-.66,.51],[.66,.51],[.96,.24],[1.03,-.23],[.79,-.58],[.43,-.71],[-.43,-.71],[-.79,-.58],[-1.03,-.23],[-.96,.24]],
    wedge: [[-.70,.46],[.70,.46],[1.015,-.18],[.48,-.73],[-.48,-.73],[-1.015,-.18]],
    ruff: [[-.70,.46],[.70,.46],[.86,.12],[1.10,-.14],[.99,-.22],[1.12,-.34],[.94,-.38],[1.01,-.51],[.79,-.57],[.64,-.73],[.34,-.80],[-.34,-.80],[-.64,-.73],[-.79,-.57],[-1.01,-.51],[-.94,-.38],[-1.12,-.34],[-.99,-.22],[-1.10,-.14],[-.86,.12]]
  };
  function paperHead(kind) {
    const data=[],front=headContours[kind].map(([x,y])=>[x,y,.74]);
    const middle=front.map(p=>[p[0]*1.06,p[1]*1.06+.22,-.06]);
    const back=front.map(p=>[p[0]*.80,p[1]*.82+.14,-.65]);
    // One closed volume. Coat patterns are ink on this mesh, never another
    // offset head, border, face plate, or stepped silhouette.
    for(let i=0;i<front.length;i++) {
      const j=(i+1)%front.length;
      face(data,[[0,-.08,.74],front[i],front[j]],null,[0,0,1]);
      face(data,[front[i],front[j],middle[j],middle[i]],[0,-.05,0]);
      face(data,[middle[i],middle[j],back[j],back[i]],[0,-.05,0]);
      face(data,[[0,-.08,-.65],back[j],back[i]],null,[0,0,-1]);
    }
    return new Float32Array(data);
  }
  function paperEar(shape) {
    const outer=[],inner=[],cx=-shape.earX,w=shape.earWidth;
    const a=[cx-w/2,.36,.31],b=[cx+w/2,.54,.43],tip=[cx-w*.18,.54+shape.earHeight,-.025];
    const rear=[cx,.56,-.28];
    // The triangular inset and its border occupy the same plane.
    const towards=(p,q,t)=>p.map((v,i)=>v+(q[i]-v)*t);
    const front=[a,b,tip];
    const center=front.reduce((sum,p)=>sum.map((v,i)=>v+p[i]/front.length),[0,0,0]);
    const inset=front.map(p=>towards(center,p,.74));
    const normal=norm(cross(b.map((v,i)=>v-a[i]),tip.map((v,i)=>v-a[i])));
    for(let i=0;i<front.length;i++){
      const j=(i+1)%front.length;
      face(outer,[front[i],front[j],inset[j],inset[i]],null,normal);
      face(outer,[front[j],front[i],rear],center.map((v,k)=>(v+rear[k])/2));
    }
    face(inner,inset,null,normal);
    return {coat:new Float32Array(outer),inner:new Float32Array(inner)};
  }
  function paperMuzzle(shape) {
    const data=[],y=shape.muzzleY,z=.74+shape.muzzleDepth,w=shape.muzzleW;
    const h=.125;
    const front=[[-.175*w,y+h,z],[.175*w,y+h,z],[.175*w,y-h,z],[-.175*w,y-h,z]];
    const back=[[-.235*w,y+h*1.36,.742],[.235*w,y+h*1.36,.742],[.235*w,y-h*1.36,.742],[-.235*w,y-h*1.36,.742]];
    const center=[0,y,(z+.742)/2];
    face(data,front,center);
    for(let i=0;i<4;i++){const j=(i+1)%4;face(data,[front[i],front[j],back[j],back[i]],center);}
    face(data,back,center);
    return new Float32Array(data);
  }
  function paperDisc(segments=40,almond=false) {
    const data=[],front=[],back=[];
    for(let i=0;i<segments;i++) {
      const angle=i/segments*2*PI;
      const x=Math.cos(angle),s=Math.sin(angle),y=s*(almond&&s>0?.82+.18*Math.abs(x):1);
      front.push([x,y,.5]);back.push([x,y,-.5]);
    }
    face(data,front,null,[0,0,1]);face(data,back,null,[0,0,-1]);
    for(let i=0;i<segments;i++){const j=(i+1)%segments;face(data,[front[i],front[j],back[j],back[i]]);}
    return new Float32Array(data);
  }
  function paperStroke(points,width) {
    const data=[];
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],b=points[i+1],d=norm([-(b[1]-a[1]),b[0]-a[0],0]).map(v=>v*width/2);
      face(data,[a.map((v,k)=>v+d[k]),b.map((v,k)=>v+d[k]),b.map((v,k)=>v-d[k]),a.map((v,k)=>v-d[k])],null,[0,0,1]);
    }
    return new Float32Array(data);
  }
  let geometry;
  function geometries() {
    if(geometry)return geometry;
    const nose=[];face(nose,[[-.082,.035,0],[.082,.035,0],[0,-.047,0]],null,[0,0,1]);
    geometry={
      disc:paperDisc(),almond:paperDisc(40,true),nose:new Float32Array(nose),
      sleepy:paperStroke([[-.14,.015,0],[-.07,-.025,0],[0,-.04,0],[.07,-.025,0],[.14,.015,0]],.025),
      happy:paperStroke([[-.14,-.015,0],[-.07,.045,0],[0,.060,0],[.07,.045,0],[.14,-.015,0]],.025),
      mouth:paperStroke([[-.088,-.070,0],[0,0,0],[.088,-.070,0]],.022),
      stem:paperStroke([[0,0,0],[0,-.025,0]],.021)
    };
    for(const kind of Object.keys(headContours))geometry[`head-${kind}`]=paperHead(kind);
    for(const cat of CatCatalog){
      const ear=paperEar(cat.shape);
      geometry[`ear-${cat.id}`]=ear.coat;
      geometry[`inner-${cat.id}`]=ear.inner;
      geometry[`muzzle-${cat.id}`]=paperMuzzle(cat.shape);
    }
    return geometry;
  }
  const VERTEX=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aNormal;
  uniform mat4 uModel,uViewProjection,uLightProjection;
  out vec3 vWorld,vNormal,vLocal;
  out vec4 vLight;
  void main(){
    vec4 world=uModel*vec4(aPosition,1.0);
    vWorld=world.xyz;
    vLocal=aPosition;
    vNormal=normalize(mat3(transpose(inverse(uModel)))*aNormal);
    vLight=uLightProjection*world;
    gl_Position=uViewProjection*world;
  }`;
  const FRAGMENT=`#version 300 es
  precision highp float;
  in vec3 vWorld,vNormal,vLocal;
  in vec4 vLight;
  uniform vec3 uColor;
  uniform sampler2D uShadow;
  out vec4 fragColor;
  ${CatCoatShader}
  float hashPaper(vec3 p){
    p=fract(p*vec3(.1031,.1030,.0973));
    p+=dot(p,p.yxz+33.33);
    return fract((p.x+p.y)*p.z);
  }
  float paperNoise(vec3 p){
    vec3 i=floor(p),f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(mix(hashPaper(i),hashPaper(i+vec3(1,0,0)),f.x),
                   mix(hashPaper(i+vec3(0,1,0)),hashPaper(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hashPaper(i+vec3(0,0,1)),hashPaper(i+vec3(1,0,1)),f.x),
                   mix(hashPaper(i+vec3(0,1,1)),hashPaper(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float visibility(vec3 n,vec3 l){
    vec3 p=vLight.xyz/vLight.w*.5+.5;
    if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;
    float bias=max(.0012*(1.-dot(n,l)),.00045),lit=0.;
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
      float d=texture(uShadow,p.xy+vec2(float(x),float(y))*2.2/1024.).r;
      lit+=p.z-bias<=d?1.:0.;
    }
    return .30+.70*lit/9.;
  }
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  void main(){
    // Each paper panel keeps its geometric normal and one clear plane of light.
    // There are no reflected softboxes or clear-coat highlights on the cardstock.
    vec3 n=normalize(vNormal);
    vec3 key=normalize(vec3(-3.4,5.,4.)),fill=normalize(vec3(3.,1.,3.));
    float shadow=visibility(n,key);
    vec3 diffuse=mix(vec3(.25,.19,.15),vec3(.46,.43,.39),n.y*.5+.5);
    diffuse+=vec3(1.,.94,.85)*max(dot(n,key),0.)*1.03*shadow;
    diffuse+=vec3(1.,.85,.73)*max(dot(n,fill),0.)*.19;
    // Object-space fibers move with the cat. Fade subpixel grain at small sizes.
    float footprint=length(fwidth(vLocal));
    float fineFade=1.-smoothstep(.0017,.008,footprint);
    float fiberFade=1.-smoothstep(.003,.014,footprint);
    float grain=(paperNoise(vLocal*vec3(175.,205.,190.))-.5)*.12*fineFade;
    grain+=(paperNoise(vLocal*vec3(48.,225.,81.)+vec3(12.7))-.5)*.045*fiberFade;
    grain+=(paperNoise(vLocal*34.+vec3(3.8))-.5)*.025;
    vec3 linear=coatColor(vLocal)*diffuse*(1.+grain);
    fragColor=vec4(pow(aces(linear),vec3(1./2.2)),1.);
  }`;
  const DEPTH_VERTEX=`#version 300 es
    precision highp float;layout(location=0)in vec3 aPosition;
    uniform mat4 uModel,uLightProjection;
    void main(){gl_Position=uLightProjection*uModel*vec4(aPosition,1.);}`;
  const DEPTH_FRAGMENT=`#version 300 es
    precision highp float;void main(){}`;

  function create(canvas) {
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
    if(!gl)throw new Error('当前浏览器未启用 WebGL 2，无法显示立体猫咪。');
    const resources={programs:[],buffers:[],vaos:[],textures:[],framebuffers:[]};
    let destroyed=false;
    function destroy(){
      if(destroyed)return;
      destroyed=true;
      for(const value of resources.vaos)gl.deleteVertexArray(value);
      for(const value of resources.buffers)gl.deleteBuffer(value);
      for(const value of resources.framebuffers)gl.deleteFramebuffer(value);
      for(const value of resources.textures)gl.deleteTexture(value);
      for(const value of resources.programs)gl.deleteProgram(value);
      for(const values of Object.values(resources))values.length=0;
    }
    try {
    function program(vs,fs){
      const shaders=[];
      const compile=(type,src)=>{const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'无法编译头像着色器。');return s;};
      const p=gl.createProgram();resources.programs.push(p);
      try{
        const v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);
        gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
        if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'无法连接头像着色器。');
        return {p,uniforms:new Proxy({}, {get:(o,k)=>k in o?o[k]:(o[k]=gl.getUniformLocation(p,k))})};
      }finally{for(const shader of shaders)gl.deleteShader(shader);}
    }
    const main=program(VERTEX,FRAGMENT),depth=program(DEPTH_VERTEX,DEPTH_FRAGMENT),meshes={};
    for(const [key,vertices]of Object.entries(geometries())){
      const vao=gl.createVertexArray(),buffer=gl.createBuffer();
      resources.vaos.push(vao);resources.buffers.push(buffer);
      gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
      gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
      meshes[key]={vao,buffer,count:vertices.length/6};
    }
    const shadowTexture=gl.createTexture();resources.textures.push(shadowTexture);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1024,1024,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const shadowFbo=gl.createFramebuffer();resources.framebuffers.push(shadowFbo);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTexture,0);
    gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const lightProjection=mul(ortho(-2.2,2.2,-2.2,2.2,.1,16),lookAt([-3.4,5,4],[0,0,0]));
    const viewProjection=mul(ortho(-1.75,1.75,-1.75,1.75,.1,20),lookAt([0,0,6],[0,0,0]));
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
    const cats=new Map(CatCatalog.map(cat=>[cat.id,cat]));
    const colors=new Map(CatCatalog.map(cat=>[cat.id,{
      coat:hex(cat.coat),light:hex(cat.light),mark:hex(cat.marking),second:hex(cat.secondary),
      iris:hex(cat.iris),pupil:hex(cat.pupil),nose:hex(cat.nose),ear:hex(cat.ear),
      muzzle:hex(cat.muzzle),ears:cat.earCoats.map(hex)
    }]));

    function objects(pose,catId){
      const cat=cats.get(catId)||CatCatalog[0],s=cat.shape,c=colors.get(cat.id);
      // Cream uses the original unscaled head. Its paper silhouette stays
      // rigid during a hop, and a small nod avoids exposing a tall crown.
      const sx=s.rigid?1:pose.sx,sy=s.rigid?1:pose.sy;
      const pitch=s.rigid?clamp(pose.pitch,-.10,.10):pose.pitch;
      const root=mul(translate(pose.x*.022,-.25-pose.y*.025+(sy-1)*.72,0),mul(rz(-pose.roll),mul(rx(-pitch+.025),mul(ry(pose.yaw-.17),scale(sx*s.width,sy*s.height,s.depth)))));
      const list=[];
      const add=(mesh,local,color,pattern=0)=>list.push({mesh,model:mul(root,local),color,pattern,paint:c});
      add(`head-${s.kind}`,identity(),c.coat,cat.pattern);
      add(`ear-${cat.id}`,identity(),c.ears[0]);add(`inner-${cat.id}`,identity(),c.ear);
      add(`ear-${cat.id}`,scale(-1,1,1),c.ears[1]);add(`inner-${cat.id}`,scale(-1,1,1),c.ear);
      for(const side of [-1,1]){
        const open=clamp((1-pose.w[2])*(1-pose.w[1]*pose.laugh)*pose.eyeOpen*(1-(side<0?pose.blinkL:pose.blinkR)),0,1);
        const eyeX=side*s.eyeX,eyeY=s.eyeY,tilt=rz(side*s.eyeTilt),disc=cat.id==='american'?'almond':'disc';
        if(open>.13){
          // Flat cut-paper circles: colour ring and pupil have a tiny real
          // thickness, while their large front faces stay completely flat.
          add(disc,mul(translate(eyeX,eyeY,.761),mul(tilt,scale(s.eyeW,s.eyeH*open,.018))),c.iris);
          add(disc,mul(translate(eyeX+pose.lookX*.008,eyeY-pose.lookY*.008,.778),mul(tilt,scale(s.eyeW*.68,s.eyeH*.71*open,.010))),c.pupil);
        }else{
          add(pose.w[2]>.45?'sleepy':'happy',mul(translate(eyeX,eyeY,.758),mul(tilt,scale(s.eyeW/.191,1,1))),cat.id==='black'?c.iris:c.pupil);
        }
      }
      const noseZ=.74+s.muzzleDepth+.005;
      add(`muzzle-${cat.id}`,identity(),c.muzzle);
      add('nose',translate(0,s.muzzleY+.045,noseZ),c.nose);
      add('stem',translate(0,s.muzzleY+.003,noseZ),c.nose);
      add('mouth',translate(0,s.muzzleY-.017,noseZ),c.nose);
      return list;
    }
    function render(pose,catId,width,height,target=null){
      if(destroyed)throw new Error('头像渲染器已经释放。');
      const list=objects(pose,catId);
      gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);gl.viewport(0,0,1024,1024);gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(depth.p);gl.uniformMatrix4fv(depth.uniforms.uLightProjection,false,lightProjection);
      for(const obj of list){gl.bindVertexArray(meshes[obj.mesh].vao);gl.uniformMatrix4fv(depth.uniforms.uModel,false,obj.model);gl.drawArrays(gl.TRIANGLES,0,meshes[obj.mesh].count);}
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(main.p);gl.uniformMatrix4fv(main.uniforms.uViewProjection,false,viewProjection);gl.uniformMatrix4fv(main.uniforms.uLightProjection,false,lightProjection);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.uniform1i(main.uniforms.uShadow,0);
      for(const obj of list){
        gl.bindVertexArray(meshes[obj.mesh].vao);gl.uniformMatrix4fv(main.uniforms.uModel,false,obj.model);
        gl.uniform3fv(main.uniforms.uColor,obj.color);
        gl.uniform1i(main.uniforms.uPattern,obj.pattern);
        gl.uniform3fv(main.uniforms.uLightColor,obj.paint.light);
        gl.uniform3fv(main.uniforms.uMarkColor,obj.paint.mark);
        gl.uniform3fv(main.uniforms.uSecondColor,obj.paint.second);
        gl.drawArrays(gl.TRIANGLES,0,meshes[obj.mesh].count);
      }
      gl.bindVertexArray(null);
    }
    function exportCanvas(pose,catId,size=1024){
      if(destroyed)throw new Error('头像渲染器已经释放。');
      const limit=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      if(!Number.isInteger(size)||size<1||size>limit)throw new RangeError(`导出尺寸必须是 1 到 ${limit} 之间的整数。`);
      const fbo=gl.createFramebuffer(),texture=gl.createTexture(),rb=gl.createRenderbuffer();
      try{
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('当前设备无法分配头像导出画布。');
      render(pose,catId,size,size,fbo);
      const pixels=new Uint8Array(size*size*4);gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      const output=canvas.ownerDocument.createElement('canvas');output.width=output.height=size;
      const ctx=output.getContext('2d'),img=ctx.createImageData(size,size);
      for(let y=0;y<size;y++)img.data.set(pixels.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);
      ctx.putImageData(img,0,0);
      return output;
      }finally{
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindRenderbuffer(gl.RENDERBUFFER,null);
        gl.deleteFramebuffer(fbo);gl.deleteTexture(texture);gl.deleteRenderbuffer(rb);
      }
    }
    return {draw:(pose,catId,width=canvas.width,height=canvas.height)=>render(pose,catId,width,height),exportCanvas,destroy};
    }catch(error){destroy();throw error;}
  }
  return {create};
})();


/* Mimi Avatars public browser runtime.
   All instances share one WebGL context and one animation clock. Each mount
   receives a transparent 2D canvas, so a list of cats does not exhaust the
   browser's WebGL context limit. No DOM is accessed while importing. */
const MimiAvatars = (() => {
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

const { createAvatar, cats } = MimiAvatars;
export { createAvatar, cats };
export default MimiAvatars;
