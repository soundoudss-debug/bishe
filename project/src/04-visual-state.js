// ========== 视觉状态 ==========
let activeNote = null;   // 探索模式当前长音：'do' | 're' | null
let exploreLevel = 0;    // 探索模式持续张开级别
let pulse = 0;           // 学习模式单次脉冲
let pulseNote = 'do';    // 学习模式脉冲对应音符（含 'err'）
let mode = 'explore';

const colorWhite = new THREE.Color(0xffffff);
const colorWarm  = new THREE.Color(0xffe2a8);
const colorRe    = new THREE.Color(0x1e90ff);
const colorErr   = new THREE.Color(0xff5a5a);
const noteEl = document.getElementById('note-display');

// 各音符对应的粒子球颜色（须在 animate() 启动前定义）
const NOTE_PARTICLE_COLORS = {
    do: new THREE.Color(0xffe2a8), re: new THREE.Color(0x1e90ff),
    mi: new THREE.Color(0xffa060), fa: new THREE.Color(0x40d080),
    sol: new THREE.Color(0xb070ff), la: new THREE.Color(0xffd040),
    si: new THREE.Color(0xff609a)
};

