// ========== 音频模块（只负责合成器发声） ==========
// 订阅识别层的手势事件发声，不读取手部关键点，也不再负责视觉与录制。
let synth = null;
let audioNote = null;   // 本模块当前正在响的长音（内部去重/释音用）

// 音符起音：探索/创作模式的长音
AppBus.on('gesture:note', ({ value: note }) => {
    if (mode === 'learn') return;                       // Learn 用短音，由学习模块自管
    if (mode === 'create' && playState === 'playing') return; // 回放中不叠加手势音
    if (synth) {
        if (audioNote) synth.triggerRelease();
        synth.triggerAttack(NOTE_STYLES[note].pitch);
    }
    audioNote = note;
});

// 音符释音：握拳复位 / 模式切换
AppBus.on('gesture:release', () => {
    if (mode === 'learn') return;
    if (mode === 'create' && playState === 'playing') return;
    if (synth && audioNote) synth.triggerRelease();
    audioNote = null;
});
