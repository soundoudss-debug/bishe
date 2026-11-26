// ========== 识别状态机（防抖 + 握拳复位门控） ==========
// 本模块只负责：手部关键点 → 音符分类 → 防抖确认 → 门控，然后通过事件总线
// 对外发布标准事件。不直接调用音频/视觉/学习，也不直接操作任何 DOM。
let stableGesture = 'none';   // 'do'..'si' | 'fist' | 'none'
let candidate = null;
let candFrames = 0;
let armed = true;             // 拳头复位门控：true 时才允许演奏下一音
let handLostTimer = null;     // 手离开画面的宽限计时器

// 从 MediaPipe 结果中取检测置信度（无 handedness 信息时按 1 处理）
function getConfidence(results) {
    const h = results.multiHandedness && results.multiHandedness[0];
    return h && typeof h.score === 'number' ? h.score : 1;
}

// 统一的停音出口：发带"停音原因"的 release 事件，音频层据此渐弱并打印调试信息
function doRelease(reason, timestamp) {
    AppBus.emit('gesture:release', { type: 'release', reason: reason, timestamp: timestamp });
}

function onResults(results) {
    const landmarks = results.multiHandLandmarks && results.multiHandLandmarks[0];
    const confidence = getConfidence(results);
    const timestamp = performance.now();

    // 手离开画面：先进入宽限，不立即停音；宽限到期仍无手才停
    if (!landmarks) {
        if (!handLostTimer) {
            handLostTimer = setTimeout(() => {
                handLostTimer = null;
                stableGesture = 'none'; candidate = null; candFrames = 0;
                doRelease('hand_lost', performance.now());
            }, CONFIG.gesture.handLostGraceMs);
        }
        AppBus.emit('gesture:status', {
            type: 'status', hasHand: false, stable: stableGesture,
            armed: armed, timestamp: timestamp
        });
        return;
    }

    // 手在画面：若正处于离开宽限，立即取消宽限，保持原音不停
    if (handLostTimer) { clearTimeout(handLostTimer); handLostTimer = null; }

    // 分类顺序：Do → 拳头（优先于 Re，防握拳误判）→ Re → 其余组合
    let raw = 'none';
    if (isOpenPalm(landmarks)) raw = 'do';
    else if (isFist(landmarks)) raw = 'fist';
    else if (isThumbOnly(landmarks)) raw = 're';
    else raw = classifyFingerCombo(landmarks);

    // 握拳复位门控：未复位（armed=false）时，只拦截"新出现的"音符；
    // 与当前稳定音相同（持续按住同一音）则放行，避免把保持的长音误判成无效
    if (raw !== 'none' && raw !== 'fist' && !armed && raw !== stableGesture) {
        raw = 'none';
    }

    // 音符/拳头确认需连续 confirmFrames 帧；无效（none）需连续 invalidFrames 帧，期间保持上一个音
    if (raw === stableGesture) {
        candidate = null; candFrames = 0;
    } else if (raw === candidate) {
        candFrames++;
        const need = raw === 'none' ? CONFIG.gesture.invalidFrames : CONFIG.gesture.confirmFrames;
        if (candFrames >= need) {
            stableGesture = raw; candidate = null; candFrames = 0;
            emitConfirmed(stableGesture, confidence, timestamp);
        }
    } else {
        candidate = raw; candFrames = 1;
    }

    // 心跳：手在画面且当前稳定值是有效音符，每帧通知音频层刷新看门狗
    if (stableGesture !== 'none' && stableGesture !== 'fist') {
        AppBus.emit('gesture:heartbeat', { type: 'heartbeat', timestamp: timestamp });
    }

    // 每帧发布状态事件，UI 层据此渲染摄像框文字与警告（识别层不碰 DOM）
    AppBus.emit('gesture:status', {
        type: 'status',
        hasHand: true,
        stable: stableGesture,
        armed: armed,
        timestamp: timestamp
    });
}

// 稳定手势确认后的唯一对外出口：只发标准事件（统一带 type 字段）
function emitConfirmed(g, confidence, timestamp) {
    if (g === 'fist') {
        armed = true;
        AppBus.emit('gesture:fist', { type: 'fist', value: 'fist', confidence: confidence, timestamp: timestamp });
        doRelease('fist', timestamp);
    } else if (g === 'none') {
        // 连续多帧非法组合：提示无效，同时停音（保持上一个音的逻辑由"连续确认"天然保证）
        AppBus.emit('gesture:invalid', { type: 'invalid', timestamp: timestamp });
        doRelease('invalid', timestamp);
    } else {
        armed = false;
        AppBus.emit('gesture:note', {
            type: 'note',
            value: g,
            confidence: confidence,
            timestamp: timestamp
        });
    }
}
