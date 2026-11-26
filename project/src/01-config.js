// ========== 全局参数配置 ==========
// 所有可调参数集中在这里，注释里写明"调大/调小会怎样"，改参数不用翻业务代码。
const CONFIG = {
    // ----- 粒子球 / 画面参数 -----
    particleCount: 3000,      // 粒子数量：调大更密集但更吃性能，调小更流畅
    sphereRadius: 2,          // 粒子球初始半径
    shellThickness: 0.1,      // 粒子在球壳上的厚度分布
    floatAmplitude: 0.1,      // 粒子漂浮幅度：调大晃动更明显
    rotationSpeed: 0.001,     // 球的自转速度：调大转得更快
    particleSize: 0.02,       // 单颗粒子大小
    spreadAmount: 0.35,       // 奏音时球张开的幅度：调大张开更夸张
    smoothSpeed: 0.04,        // 画面平滑强度：调大变化更快更利落，调小更缓慢柔和

    // ----- 手势识别参数（数值保持与原硬编码一致，仅集中管理）-----
    gesture: {
        // Do 五指张开
        openPalmFingerRatio: 1.05, // Do 四指距离比：指尖到腕需 > 指根×此值；调大要求手指更直更严格，调小更容易判 Do
        openPalmThumbRatio: 0.95,  // Do 拇指张开阈值（倍掌宽）：调大要求拇指张得更开
        // Re 单拇指
        thumbOutWristRatio: 1.1,   // Re 拇指外展：拇指尖到腕需 > 拇指根×此值；调大 Re 更严格
        thumbOutPalmRatio: 0.55,   // Re 拇指离掌宽比例：调大要求拇指离手掌更远
        thumbSeparateRatio: 0.6,   // Re 拇指与食指分离（倍掌宽）：调大更能区分握拳，调小握拳更易误判成 Re
        // 单指是否伸出（Mi/Fa/Sol/La/Si 共用）
        fingerWristRatio: 1.02,    // 指尖到腕距离比：调小更容易算伸出（但可能误判），调大更严格
        fingerStraightRatio: 1.15, // 手指拉直度：调小微弯也算伸出，调大要求更直
        fingerJointAngle: 150,     // 关节角度大于此值算伸直：调小更容忍弯曲，调大要求更直
        // 防抖确认帧数
        confirmFrames: 3,          // 音符/拳头需连续确认的帧数：调大更稳但反应变慢，调小更灵敏但易抖动
        invalidFrames: 5,          // 无效手势需连续确认的帧数：调大更不容易误报无效
        // MediaPipe 自身置信度
        detectionConfidence: 0.7,  // 检测置信度：调大更严格（可能漏检），调小更容易找到手
        trackingConfidence: 0.6,   // 跟踪置信度：调大跟踪更稳但可能丢手，调小更不容易丢
        // 警告红字延迟
        warningDelayMs: 700        // 无效姿势持续多少毫秒才弹红字：调大更不容易在弹奏过渡时闪红字
    }
};
