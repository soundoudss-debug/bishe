// ========== 学习模式逻辑 ==========
// 七音练习序列（简谱 1-7）：Do Re Mi Fa Sol La Si Do
const SEQUENCE = ['do','re','mi','fa','sol','la','si','do'];
const NUM = { do: '1', re: '2', mi: '3', fa: '4', sol: '5', la: '6', si: '7' };
const RULE_TEXT = {
    do: 'Do-五指', re: 'Re-拇指', mi: 'Mi-食指', fa: 'Fa-食中指',
    sol: 'Sol-三指', la: 'La-四指', si: 'Si-小指'
};
const cardsEl = document.getElementById('score-cards');
const learnStatusEl = document.getElementById('learn-status');
const cardEls = [];

SEQUENCE.forEach((n) => {
    const c = document.createElement('div');
    c.className = 'score-card';
    c.innerHTML = '<span class="num">' + NUM[n] + '</span>' +
                  '<span class="syl">' + NOTE_STYLES[n].text + '</span>';
    cardsEl.appendChild(c);
    cardEls.push(c);
});

let learnState = 'idle';   // idle | demo | practice | done
let lStep = 0, lWrong = 0, lCanSubmit = false;
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function resetCards() {
    cardEls.forEach(c => c.className = 'score-card');
}

function startPracticeUI() {
    resetCards();
    cardEls[0].classList.add('current');
    learnState = 'practice';
    lStep = 0; lWrong = 0; lCanSubmit = true;
    learnStatusEl.textContent = '请演奏第 1 个音符：参考左下角手势图，每音后握拳复位';
}

function enterLearn() {
    startPracticeUI();
}

async function playDemo() {
    if (learnState === 'demo') return;
    learnState = 'demo';
    resetCards();
    learnStatusEl.textContent = '示范演奏中，请观察简谱与粒子...';
    for (let i = 0; i < SEQUENCE.length; i++) {
        cardEls[i].classList.add('current');
        pulse = 1; pulseNote = SEQUENCE[i];
        synth.triggerAttackRelease(NOTE_STYLES[SEQUENCE[i]].pitch, '4n');
        await wait(430);
        cardEls[i].classList.remove('current');
        if (learnState !== 'demo') return;  // 被模式切换打断
    }
    startPracticeUI();
}

function learnOnGesture(g) {
    if (learnState !== 'practice') return;
    if (g === null) {
        lCanSubmit = true;
        cardEls[lStep].classList.remove('error');
        return;
    }
    if (!lCanSubmit) return;
    lCanSubmit = false;

    const expected = SEQUENCE[lStep];
    const card = cardEls[lStep];

    if (g === expected) {
        synth.triggerAttackRelease(NOTE_STYLES[g].pitch, '4n');
        pulse = 1; pulseNote = g;
        card.classList.remove('current', 'error');
        card.classList.add('done');
        lStep++;
        if (lStep >= SEQUENCE.length) {
            finishLearn();
        } else {
            cardEls[lStep].classList.add('current');
            learnStatusEl.textContent = '正确！握拳复位后演奏第 ' + (lStep + 1) + ' 个音符';
        }
    } else {
        card.classList.add('error');
        pulse = 0.5; pulseNote = 'err';
        lWrong++;
        learnStatusEl.textContent = '这个音应是 ' + RULE_TEXT[expected] + '，握拳复位后再试';
    }
}

function finishLearn() {
    learnState = 'done';
    cardEls.forEach(c => c.className = 'score-card done');
    const acc = Math.round(SEQUENCE.length / (SEQUENCE.length + lWrong) * 100);
    learnStatusEl.textContent = '完成！本次正确率 ' + acc + '%，可点击“重新开始”再练';
}

// 学习模块订阅手势事件（内部 learnState 守卫保证仅练习中生效）
AppBus.on('gesture:note', ({ value: note }) => learnOnGesture(note));
AppBus.on('gesture:release', () => learnOnGesture(null));

document.getElementById('demo-btn').addEventListener('click', () => {
    if (synth) playDemo();
});
document.getElementById('reset-btn').addEventListener('click', () => {
    if (synth) startPracticeUI();
});

