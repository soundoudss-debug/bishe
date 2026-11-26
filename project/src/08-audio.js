// ========== 音频模块（只负责合成器发声） ==========
// 订阅识别层的手势事件发声，不读取手部关键点，也不再负责视觉与录制。
let synth = null;
let audioNote = null;     // 本模块当前正在响的长音（内部去重/释音用）
let holdTimer = null;     // 看门狗计时器
let noteStartTs = 0;      // 当前音起音时间，用于调试打印持续时长

// 停音原因代码 → 中文说明（调试打印用）
const REASON_TEXT = {
    fist: '握拳复位',
    hand_lost: '手离开画面',
    invalid: '非法组合',
    watchdog: '看门狗超时',
    gesture: '手势变化'
};

// 调试打印：每次真正停音时输出原因和持续时间
function logStop(reason, now) {
    if (!CONFIG.debug) return;
    const text = REASON_TEXT[reason] || reason;
    const dur = noteStartTs ? Math.round(now - noteStartTs) : 0;
    console.log('[停音] 原因=' + text + '，持续=' + dur + 'ms');
}

// 看门狗：每次收到心跳/起音都刷新；只有识别彻底失联、超过 holdTimeoutMs 才触发
function armWatchdog() {
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
        const now = performance.now();
        if (synth && audioNote) synth.triggerRelease();  // 同样走 envelope 淡出
        logStop('watchdog', now);
        audioNote = null; holdTimer = null;
    }, CONFIG.gesture.holdTimeoutMs);
}
function clearWatchdog() {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
}

// 音符起音：探索/创作模式的长音
AppBus.on('gesture:note', ({ value: note }) => {
    if (mode === 'learn') return;                       // Learn 用短音，由学习模块自管
    if (mode === 'create' && playState === 'playing') return; // 回放中不叠加手势音
    if (synth) {
        if (audioNote) synth.triggerRelease();
        synth.triggerAttack(NOTE_STYLES[note].pitch);
    }
    audioNote = note;
    noteStartTs = performance.now();
    armWatchdog();
});

// 心跳：手持续在画面、保持音符时每帧刷新看门狗，保证正常按住不会被超时切断
AppBus.on('gesture:heartbeat', () => {
    if (audioNote) armWatchdog();
});

// 音符释音：握拳复位 / 非法组合 / 手离开 / 模式切换，走淡出而非硬切
AppBus.on('gesture:release', (payload = {}) => {
    if (mode === 'learn') return;
    if (mode === 'create' && playState === 'playing') return;
    clearWatchdog();
    if (synth && audioNote) {
        synth.triggerRelease();                         // envelope.release 控制 100ms 渐弱
        logStop(payload.reason || 'gesture', performance.now());
    }
    audioNote = null;
});
