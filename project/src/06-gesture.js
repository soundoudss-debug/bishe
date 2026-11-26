// ========== 手势识别 ==========
const videoEl = document.getElementById('video');
const statusEl = document.getElementById('status');
const warningEl = document.getElementById('gesture-warning');

const dist3d = (a, b) =>
    Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

function isOpenPalm(lm) {
    const wrist = lm[0];
    const fourFingers = [[8,6], [12,10], [16,14], [20,18]];
    const fingersExtended = fourFingers.every(([tip, pip]) =>
        dist3d(lm[tip], wrist) > dist3d(lm[pip], wrist) * CONFIG.gesture.openPalmFingerRatio);
    const palmWidth = dist3d(lm[5], lm[17]);
    const thumbExtended = dist3d(lm[4], lm[17]) > palmWidth * CONFIG.gesture.openPalmThumbRatio;
    return fingersExtended && thumbExtended;
}

function isThumbOnly(lm) {
    const wrist = lm[0];
    const palmWidth = dist3d(lm[5], lm[17]);
    const othersFolded = [[8,6], [12,10], [16,14], [20,18]]
        .every(([tip, pip]) => dist3d(lm[tip], wrist) < dist3d(lm[pip], wrist));
    // 拇指外展：拇指尖远离手腕与食指根
    const thumbOut =
        dist3d(lm[4], wrist) > dist3d(lm[2], wrist) * CONFIG.gesture.thumbOutWristRatio &&
        dist3d(lm[4], lm[5]) > palmWidth * CONFIG.gesture.thumbOutPalmRatio;
    // 拇指与食指分离：Re 拇指外展时距离大；握拳时拇指贴食指，距离小
    const thumbApart = dist3d(lm[4], lm[6]) > palmWidth * CONFIG.gesture.thumbSeparateRatio;
    return othersFolded && thumbOut && thumbApart;
}

// PIP 关节处夹角：MCP→PIP 与 PIP→DIP 两段的夹角，伸直时接近 180°，弯曲时变小
function angleAtJoint(mcp, pip, dip) {
    const v1 = { x: mcp.x - pip.x, y: mcp.y - pip.y, z: (mcp.z || 0) - (pip.z || 0) };
    const v2 = { x: dip.x - pip.x, y: dip.y - pip.y, z: (dip.z || 0) - (pip.z || 0) };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const n1 = Math.hypot(v1.x, v1.y, v1.z);
    const n2 = Math.hypot(v2.x, v2.y, v2.z);
    if (n1 === 0 || n2 === 0) return 0;
    const cos = Math.max(-1, Math.min(1, dot / (n1 * n2)));
    return Math.acos(cos) * 180 / Math.PI;
}

// 单根手指是否伸展：三指标确认，任一成立即算伸出
// ①指尖到腕距离比 ②手指拉直度 ③PIP 关节夹角，阈值均在 CONFIG.gesture 中
function fingerExtended(lm, tip, dip, pip, mcp) {
    const wrist = lm[0];
    const g = CONFIG.gesture;
    const ratioWrist = dist3d(lm[tip], wrist) / dist3d(lm[pip], wrist);
    const straight = dist3d(lm[tip], mcp) > dist3d(lm[pip], mcp) * g.fingerStraightRatio;
    const jointAngle = angleAtJoint(lm[mcp], lm[pip], lm[dip]);
    return ratioWrist > g.fingerWristRatio || straight || jointAngle > g.fingerJointAngle;
}

// 拇指是否收拢（Mi-Si 各姿势与拳头均要求拇指收拢）
// 与 isThumbOnly 采用同一组阈值、严格互斥：拇指贴食指即判收拢
function isThumbFolded(lm) {
    const wrist = lm[0];
    const palmWidth = dist3d(lm[5], lm[17]);
    const nearPalm = dist3d(lm[4], lm[5]) < palmWidth * CONFIG.gesture.thumbOutPalmRatio ||
                     dist3d(lm[4], wrist) < dist3d(lm[2], wrist) * CONFIG.gesture.thumbOutWristRatio;
    const nearIndex = dist3d(lm[4], lm[6]) < palmWidth * CONFIG.gesture.thumbSeparateRatio;
    return nearPalm || nearIndex;
}

// 基于四指（食指/中指/无名指/小指）伸展组合的精细分类
function classifyFingerCombo(lm) {
    if (!isThumbFolded(lm)) return 'none';
    const key = [
        fingerExtended(lm, 8, 7, 6, 5),
        fingerExtended(lm, 12, 11, 10, 9),
        fingerExtended(lm, 16, 15, 14, 13),
        fingerExtended(lm, 20, 19, 18, 17)
    ].map(v => v ? 1 : 0).join('');
    const map = {
        '1000': 'mi',
        '1100': 'fa',
        '1110': 'sol',
        '1111': 'la',
        '0001': 'si',
        '0000': 'fist'
    };
    return map[key] || 'none';
}

