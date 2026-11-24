// ========== 摄像框 UI 控制器 ==========
// 只订阅识别层的状态事件来刷新文字与警告框，本身不做任何手势判定。
let warningTimer = null;    // 警告延迟计时器
const WARNING_DELAY = 700;  // 无效姿势持续 700ms 才弹红字，正常摆手势的过渡不会闪

AppBus.on('gesture:status', ({ hasHand, stable, armed }) => {
    if (!hasHand) {
        statusEl.textContent = '未检测到手';
    } else if (stable === 'fist') {
        statusEl.textContent = '拳头复位 ✓ 可奏下一音';
    } else if (NOTE_STYLES[stable]) {
        statusEl.textContent = armed
            ? NOTE_STYLES[stable].text + ' ✓'
            : NOTE_STYLES[stable].text + ' ✓ 请握拳复位';
    } else if (!armed) {
        statusEl.textContent = '请先握拳复位，再奏下一音';
    } else {
        statusEl.textContent = '调整手势...';
    }

    // 探索/创作模式无效手势提示（回放中不显示）
    const invalid = (mode === 'explore' || mode === 'create') &&
        playState !== 'playing' && hasHand && stable === 'none';

    if (invalid) {
        // 仅当无效状态持续保持 WARNING_DELAY 才显示，避免弹奏过渡瞬间闪红字
        if (warningTimer === null) {
            warningTimer = setTimeout(() => warningEl.classList.add('show'), WARNING_DELAY);
        }
    } else {
        // 一旦识别到有效音符/拳头/手消失/回放，立即取消计时并隐藏
        if (warningTimer !== null) {
            clearTimeout(warningTimer);
            warningTimer = null;
        }
        warningEl.classList.remove('show');
    }
});
