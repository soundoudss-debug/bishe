// ========== 键盘替身（测试用，不依赖摄像头） ==========
// 按键盘 1-7 发出与手势完全相同的标准事件，用来验证声音/画面只依赖事件、不读关键点。
const KEY_NOTES = { '1': 'do', '2': 're', '3': 'mi', '4': 'fa',
                    '5': 'sol', '6': 'la', '7': 'si' };
const pressedKeys = new Set();   // 记录已按下的键，防止按住时重复触发

// 按下：发出音符事件（confidence 固定为 1，表示键盘输入完全确定）
document.addEventListener('keydown', (e) => {
    const note = KEY_NOTES[e.key];
    if (!note || pressedKeys.has(e.key)) return;
    pressedKeys.add(e.key);
    AppBus.emit('gesture:note', {
        type: 'note',
        value: note,
        confidence: 1,
        timestamp: performance.now()
    });
});

// 松开：发出释音事件
document.addEventListener('keyup', (e) => {
    const note = KEY_NOTES[e.key];
    if (!note) return;
    pressedKeys.delete(e.key);
    AppBus.emit('gesture:release', {
        type: 'release',
        timestamp: performance.now()
    });
});
