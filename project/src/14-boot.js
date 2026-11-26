// ========== START BUTTON (instrumented) ==========
window.__boot = [];
const bootLog = (m) => { window.__boot.push(String(m)); };
document.getElementById('start-btn').addEventListener('click', async () => {
    bootLog('click fired');
    Tone.start().then(() => bootLog('tone ok')).catch(e => bootLog('tone err ' + e.message));
    try {
        bootLog('before getUserMedia');
        const gum = navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const timer = new Promise((_, rej) => setTimeout(() => rej(new Error('getUserMedia timeout')), 6000));
        const stream = await Promise.race([gum, timer]);
        bootLog('got stream');
        videoEl.srcObject = stream;
        await videoEl.play();
        bootLog('video playing');

        synth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.08, decay: 0.3, sustain: 0.6, release: 0.8 }
        });
        synth.volume.value = -14;
        const freeverb = new Tone.Freeverb({ roomSize: 0.5, wet: 0.2 }).toDestination();
        synth.connect(freeverb);
        synth.toDestination();

        // 内录目标：合成器的干声与混响并行送入 MediaStream（与扬声器听到的完全一致）
        // 录制的是应用内部生成的音乐，无需麦克风权限
        mediaDest = Tone.getContext().rawContext.createMediaStreamDestination();
        synth.connect(mediaDest);
        freeverb.connect(mediaDest);
        initRecorder();

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: CONFIG.gesture.detectionConfidence,
            minTrackingConfidence: CONFIG.gesture.trackingConfidence
        });
        hands.onResults(onResults);

        const sendFrame = async () => {
            if (videoEl.readyState >= 2) {
                try { await hands.send({ image: videoEl }); } catch (e) {}
            }
            requestAnimationFrame(sendFrame);
        };
        sendFrame();

        const startScreen = document.getElementById('start-screen');
        startScreen.style.opacity = '0';
        setTimeout(() => startScreen.style.display = 'none', 500);
        document.getElementById('video-container').classList.add('active');
        document.getElementById('hint').classList.add('active');
        document.getElementById('mode-tabs').classList.add('active');
        document.getElementById('gesture-demo').classList.add('active');
        document.getElementById('gesture-demo-label').classList.add('active');
        bootLog('ui shown');
    } catch (err) {
        bootLog('CATCH ' + err.name + ' ' + err.message);
        const s = document.getElementById('status');
        if (s) s.textContent = 'Boot error: ' + err.message;
    }
});

