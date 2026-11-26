// ========== 全局参数配置 ==========
// 所有可调参数集中在这里，注释里写明"调大/调小会怎样"，改参数不用翻业务代码。
const CONFIG = {
    // ----- 调试开关 -----
    debug: true,             // 调试模式：true 时控制台打印每次停音原因和持续时间；正式演示请改为 false
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
        // 无名指独立阈值（更宽松）+ 迟滞双门槛：On=收起→伸出，Off=伸出→收回，两值之间不翻转
        ring: {
            wristOn: 1.0,          // 进入伸出的距离比门槛：调小更容易判伸出
            wristOff: 0.95,        // 收回的距离比门槛（低于 On 形成缓冲带）：调大更容易收回
            straightRatio: 1.1,    // 拉直度门槛（比食指中指的 1.15 宽松）
            angleOn: 145,          // 进入伸出的关节角门槛
            angleOff: 130          // 收回的关节角门槛
        },
        // 小指独立阈值（最短最弱，最宽松）
        pinky: {
            wristOn: 0.98,
            wristOff: 0.92,
            straightRatio: 1.08,
            angleOn: 140,
            angleOff: 125
        },
        // 防抖确认帧数
        confirmFrames: 2,          // 音符/拳头需连续确认的帧数：调小反应更快（原3帧），若抖动可调回3
        invalidFrames: 5,          // 非法组合需连续确认的帧数：期间保持上一个音，调大更不易误停、但真正出错时停得慢
        // 音频看门狗：仅在"识别彻底失联"（onResults 不再回调）时兜底。正常按住时每帧心跳都会刷新它，不会触发
        holdTimeoutMs: 2200,       // 看门狗超时（2秒以上）：调大更宽容，调小失联时更快切断
        // 手离开画面宽限：手短暂丢失先不停，宽限内手回来则保持原音
        handLostGraceMs: 180,      // 宽限毫秒（150~200）：调大更容忍手短暂丢失，调小停得更快
        // 停音淡出：triggerRelease 后用此时长渐弱，避免硬切
        noteFadeOutMs: 100,        // 淡出毫秒（80~120）：调大收尾更柔和，调小更干脆
        // MediaPipe 自身置信度
        detectionConfidence: 0.7,  // 检测置信度：调大更严格（可能漏检），调小更容易找到手
        trackingConfidence: 0.6,   // 跟踪置信度：调大跟踪更稳但可能丢手，调小更不容易丢
        // 警告红字延迟
        warningDelayMs: 700        // 无效姿势持续多少毫秒才弹红字：调大更不容易在弹奏过渡时闪红字
    }
};
