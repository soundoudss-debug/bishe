// ========== 识别状态机（防抖 + 握拳复位门控） ==========
// 本模块只负责：手部关键点 → 音符分类 → 防抖确认 → 门控，然后通过事件总线
// 对外发布标准事件。不直接调用音频/视觉/学习，也不直接操作任何 DOM。
let stableGesture = 'none';   // 'do'..'si' | 'fist' | 'none'
let candidate = null;
let candFrames = 0;
let armed = true;             // 拳头复位门控：true 时才允许演奏下一音

// 从 MediaPipe 结果中取检测置信度（无 handedness 信息时按 1 处理）
function getConfidence(results) {
    const h = results.multiHandedness && results.multiHandedness[0];
    return h && typeof h.score === 'number' ? h.score : 1;
}

function onResults(results) {
    const landmarks = results.multiHandLandmarks && results.multiHandLandmarks[0];
    const confidence = getConfidence(results);
    const timestamp = performance.now();

    let raw = 'none';
    if (landmarks) {
        if (isOpenPalm(landmarks)) raw = 'do';
        else if (isThumbOnly(landmarks)) raw = 're';
        else raw = classifyFingerCombo(landmarks);
    }

    // 握拳复位门控：未复位（armed=false）时，新音符一律不确认、不发声，
    // 仅拳头（fist）可通过；保证识别结果与实际声音/视觉始终一致
    if (raw !== 'none' && raw !== 'fist' && !armed) {
        raw = 'none';
    }

    // 音符/拳头确认需连续3帧；无效（none）需连续5帧
    if (raw === stableGesture) {
        candidate = null; candFrames = 0;
    } else if (raw === candidate) {
        candFrames++;
        const need = raw === 'none' ? 5 : 3;
        if (candFrames >= need) {
            stableGesture = raw; candidate = null; candFrames = 0;
            emitConfirmed(stableGesture, confidence, timestamp);
        }
    } else {
        candidate = raw; candFrames = 1;
    }

    // 每帧发布状态事件，UI 层据此渲染摄像框文字与警告（识别层不碰 DOM）
    AppBus.emit('gesture:status', {
        hasHand: !!landmarks,
        stable: stableGesture,
        armed: armed,
        timestamp: timestamp
    });
}

// 稳定手势确认后的唯一对外出口：只发事件
function emitConfirmed(g, confidence, timestamp) {
    if (g === 'fist') {
        armed = true;
        AppBus.emit('gesture:fist', { confidence: confidence, timestamp: timestamp });
        AppBus.emit('gesture:release', { timestamp: timestamp });
    } else if (g === 'none') {
        // 无效姿势：不发声，不改变门控状态
        AppBus.emit('gesture:invalid', { timestamp: timestamp });
    } else {
        armed = false;
        AppBus.emit('gesture:note', {
            note: g,
            confidence: confidence,
            timestamp: timestamp
        });
    }
}
