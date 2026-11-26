// 音符外观与音高配置（Do-Re-Mi-Fa-Sol-La-Si 七音）
const NOTE_STYLES = {
    do:  { text: 'Do', pitch: 'C4', color: '#ffe9b0',
           glow: '0 0 40px rgba(255,200,120,.85), 0 0 120px rgba(255,170,70,.5)' },
    re:  { text: 'Re', pitch: 'D4', color: '#9fcdff',
           glow: '0 0 40px rgba(30,144,255,.85), 0 0 120px rgba(70,150,255,.5)' },
    mi:  { text: 'Mi', pitch: 'E4', color: '#ffc99a',
           glow: '0 0 40px rgba(255,170,110,.85), 0 0 120px rgba(255,140,80,.5)' },
    fa:  { text: 'Fa', pitch: 'F4', color: '#a8ecc0',
           glow: '0 0 40px rgba(90,220,140,.85), 0 0 120px rgba(60,190,120,.5)' },
    sol: { text: 'Sol', pitch: 'G4', color: '#d6b6ff',
           glow: '0 0 40px rgba(180,130,255,.85), 0 0 120px rgba(150,100,240,.5)' },
    la:  { text: 'La', pitch: 'A4', color: '#ffe27a',
           glow: '0 0 40px rgba(255,210,90,.85), 0 0 120px rgba(240,180,60,.5)' },
    si:  { text: 'Si', pitch: 'B4', color: '#ffadc8',
           glow: '0 0 40px rgba(255,130,170,.85), 0 0 120px rgba(240,100,150,.5)' }
};

function applyNoteStyle(note) {
    if (!note) return;
    const s = NOTE_STYLES[note];
    noteEl.textContent = s.text;
    noteEl.style.color = s.color;
    noteEl.style.textShadow = s.glow;
}

// 切换视觉状态（粒子球级别 + 音符大字），不发声；实时演奏与回放共用
function setVisualNote(note) {
    activeNote = note;
    applyNoteStyle(note);
}

// 视觉模块只订阅手势事件，不读取手部关键点
AppBus.on('gesture:note', ({ value: note }) => {
    if (mode === 'learn') return;                       // Learn 视觉由脉冲(pulse)驱动
    if (mode === 'create' && playState === 'playing') return; // 回放中视觉由时间轴驱动
    setVisualNote(note);
});
AppBus.on('gesture:release', () => {
    if (mode === 'learn') return;
    if (mode === 'create' && playState === 'playing') return;
    setVisualNote(null);
});

