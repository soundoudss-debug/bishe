// ========== 模式切换 ==========
const tabEls = document.querySelectorAll('.tab');
tabEls.forEach(t => t.addEventListener('click', () => switchMode(t.dataset.mode)));

function switchMode(m) {
    if (m === mode) return;
    const prev = mode;
    // 释放当前长音：在 mode 改变前发事件，音频/视觉/录制按旧模式统一处理
    AppBus.emit('gesture:release', { timestamp: performance.now(), source: 'system' });
    mode = m;
    document.body.classList.toggle('learn-mode', m === 'learn');
    document.body.classList.toggle('create-mode', m === 'create');
    tabEls.forEach(t => t.classList.toggle('active', t.dataset.mode === m));
    if (m === 'learn') {
        enterLearn();
    } else {
        learnState = 'idle';
        pulse = 0;
    }
    // 离开创作模式：录制自动停止并保存片段，回放中止
    if (prev === 'create') {
        if (recState !== 'idle') stopRecording();
        stopPlayback();
    }
}

