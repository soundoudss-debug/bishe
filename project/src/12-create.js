// ========== 创作模式：录制 / 暂停 / 停止 / 回放 ==========
const recBtn     = document.getElementById('rec-btn');
const pauseBtn   = document.getElementById('pause-btn');
const stopBtn    = document.getElementById('stop-btn');
const playBtn    = document.getElementById('play-btn');
const recDot     = document.getElementById('rec-dot');
const recStateTx = document.getElementById('rec-state-text');
const recTimeEl  = document.getElementById('rec-time');
const segInfoEl  = document.getElementById('rec-seg-info');

let mediaDest = null;       // 合成器内录目标（MediaStreamAudioDestinationNode）
let recorder = null;        // MediaRecorder
let pauseSupported = false;

let recState = 'idle';      // idle | recording | paused（UI 与底层状态双重守卫）
let playState = 'idle';     // idle | playing
let recChunks = [];
let recEvents = [];         // 音符事件时间轴：{ t, type:'attack'|'release', note }
let recBaseMs = 0;          // 已确认的有效录制时长（暂停时刻累加）
let recSegStart = 0;        // 本次连续录制段起点
let recTick = null;
const recordings = [];      // 录制片段临时保存在应用状态中
let lastSegment = null;

let playAudio = null;
let playIv = null;

function fmtTime(ms) {
    const t = Math.max(0, ms / 1000);
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const d = Math.floor((t * 10) % 10);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + d;
}

function segInfo(text, isError) {
    segInfoEl.textContent = text;
    segInfoEl.classList.toggle('error', !!isError);
}

// 当前有效录制时间（自动扣除暂停区间，作为计时与事件时间戳的单一真值）
function recNow() {
    return recState === 'recording'
        ? recBaseMs + (performance.now() - recSegStart)
        : recBaseMs;
}

function logRecEvent(type, note) {
    if (recState !== 'recording') return;
    recEvents.push({ t: recNow(), type, note: note || null });
}

// 录音器初始化（在音频上下文启动后调用）
function initRecorder() {
    if (recorder) return;
    if (typeof MediaRecorder === 'undefined') {
        segInfo('当前浏览器不支持 MediaRecorder 录音 API', true);
        recBtn.disabled = true;
        return;
    }
    pauseSupported = typeof MediaRecorder.prototype.pause === 'function';

    let mime;
    for (const candidate of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidate)) {
            mime = candidate; break;
        }
    }
    try {
        recorder = new MediaRecorder(mediaDest.stream, mime ? { mimeType: mime } : undefined);
    } catch (err) {
        segInfo('录音初始化失败：' + err.message, true);
        recBtn.disabled = true;
        return;
    }

    recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recChunks.push(e.data);
    };
    recorder.onstop = onRecorderStopped;
    recorder.onerror = (e) => {
        segInfo('录音出错：' + ((e.error && e.error.name) || '未知错误'), true);
    };
    updateRecUI();
}

function startRecording() {
    if (!recorder || recState !== 'idle' || playState !== 'idle') return;

    recChunks = [];
    recEvents = [];
    recBaseMs = 0;
    recSegStart = performance.now();
    recTimeEl.textContent = '00:00.0';

    // 录制开始瞬间若音符正在响，补记一个 attack，保证回放头尾完整
    if (activeNote) recEvents.push({ t: 0, type: 'attack', note: activeNote });

    try {
        recorder.start(250);   // 每 250ms 切片
    } catch (err) {
        segInfo('启动录音失败：' + err.message, true);
        return;
    }
    recState = 'recording';
    recTick = setInterval(() => { recTimeEl.textContent = fmtTime(recNow()); }, 100);
    segInfo('录制中…用七个手势演奏，每音后握拳复位，可随时暂停');
    updateRecUI();
}

function togglePause() {
    if (!recorder) return;
    if (recState === 'recording' && recorder.state === 'recording') {
        if (!pauseSupported) {
            segInfo('当前浏览器不支持暂停录音，请直接停止并保存', true);
            return;
        }
        try { recorder.pause(); } catch (err) {
            segInfo('暂停失败：' + err.message, true); return;
        }
        recBaseMs += performance.now() - recSegStart;
        recState = 'paused';
        clearInterval(recTick);
        segInfo('已暂停 — 点击「继续」恢复录制');
    } else if (recState === 'paused' && recorder.state === 'paused') {
        try { recorder.resume(); } catch (err) {
            segInfo('继续失败：' + err.message, true); return;
        }
        recSegStart = performance.now();
        recState = 'recording';
        recTick = setInterval(() => { recTimeEl.textContent = fmtTime(recNow()); }, 100);
        segInfo('录制继续…');
    }
    updateRecUI();
}

function stopRecording() {
    if (!recorder || recState === 'idle') return;
    if (recState === 'recording' && recorder.state === 'recording') {
        recBaseMs += performance.now() - recSegStart;
    }
    clearInterval(recTick);
    recTick = null;
    recState = 'idle';
    recTimeEl.textContent = '00:00.0';
    try {
        if (recorder.state !== 'inactive') recorder.stop();
    } catch (err) {
        segInfo('停止录音失败：' + err.message, true);
    }
    updateRecUI();
}

// MediaRecorder 停止后：组装 Blob，作为离散片段保存到应用状态
function onRecorderStopped() {
    const duration = recBaseMs;
    if (!recChunks.length) {
        segInfo('没有录制到内容，该片段未保存', true);
        updateRecUI();
        return;
    }
    const type = recorder.mimeType || 'audio/webm';
    const blob = new Blob(recChunks, { type });
    if (blob.size < 200) {
        segInfo('录制内容过短，该片段未保存', true);
        updateRecUI();
        return;
    }
    const segment = {
        id: Date.now(),
        blob,
        url: URL.createObjectURL(blob),
        duration,
        events: recEvents.slice()
    };
    recordings.push(segment);
    lastSegment = segment;
    segInfo('已保存片段 #' + recordings.length + '（时长 ' + fmtTime(duration) +
            '），点击「播放」回放最近片段');
    updateRecUI();
}

function playLastSegment() {
    if (!lastSegment || playState === 'playing' || recState !== 'idle') return;
    const seg = lastSegment;

    setVisualNote(null);
    const audio = new Audio(seg.url);
    playAudio = audio;
    let idx = 0;

    const finish = (msg, isError) => {
        if (playIv) { clearInterval(playIv); playIv = null; }
        if (playAudio) { playAudio = null; }
        setVisualNote(null);
        playState = 'idle';
        recTimeEl.textContent = '00:00.0';
        if (msg) segInfo(msg, isError);
        updateRecUI();
    };

    audio.onended = () => finish('回放结束 — 可再次播放或录制新片段');
    audio.onerror = () => finish('回放失败：音频解码异常', true);

    playState = 'playing';
    segInfo('回放中…粒子与音符随录音同步');
    updateRecUI();

    audio.play().then(() => {
        // 以音频实际播放时间为基准重放音符事件，保证声画同步
        playIv = setInterval(() => {
            const t = audio.currentTime * 1000;
            while (idx < seg.events.length && seg.events[idx].t <= t) {
                const ev = seg.events[idx++];
                if (ev.type === 'attack') setVisualNote(ev.note);
                else setVisualNote(null);
            }
            recTimeEl.textContent = fmtTime(t);
        }, 30);
    }).catch(err => finish('无法播放录音：' + err.message, true));
}

function stopPlayback() {
    if (playState !== 'playing') return;
    if (playIv) { clearInterval(playIv); playIv = null; }
    if (playAudio) {
        const a = playAudio; playAudio = null;
        try { a.pause(); a.currentTime = 0; } catch {}
    }
    setVisualNote(null);
    playState = 'idle';
    recTimeEl.textContent = '00:00.0';
    updateRecUI();
}

// 按钮、状态灯、文案的统一刷新（状态变化的单一出口）
function updateRecUI() {
    recBtn.disabled   = !recorder || recState !== 'idle' || playState !== 'idle';
    pauseBtn.disabled = !(recState === 'recording' || recState === 'paused');
    pauseBtn.textContent = recState === 'paused' ? '继续' : '暂停';
    stopBtn.disabled  = recState === 'idle';
    playBtn.disabled  = !lastSegment || recState !== 'idle' || playState !== 'idle';
    playBtn.textContent = playState === 'playing' ? '播放中' : '播放';

    recBtn.classList.toggle('live', recState === 'recording');
    playBtn.classList.toggle('live', playState === 'playing');

    recDot.className = recState !== 'idle' ? recState
                     : (playState === 'playing' ? 'playing' : '');
    if (recState === 'recording') recStateTx.textContent = '录制中';
    else if (recState === 'paused') recStateTx.textContent = '已暂停';
    else if (playState === 'playing') recStateTx.textContent = '回放中';
    else recStateTx.textContent = '待机';
}

// 录制时间轴订阅手势事件：logRecEvent 内部仅在录制中写入
AppBus.on('gesture:note', ({ value: note }) => logRecEvent('attack', note));
AppBus.on('gesture:release', () => logRecEvent('release'));

recBtn.addEventListener('click', startRecording);
pauseBtn.addEventListener('click', togglePause);
stopBtn.addEventListener('click', stopRecording);
playBtn.addEventListener('click', playLastSegment);
updateRecUI();

