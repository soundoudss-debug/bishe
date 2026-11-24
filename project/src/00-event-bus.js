// ========== 全局事件总线 ==========
// 识别层只通过它"发事件"，音频/视觉/学习/录制/UI 只"订阅事件"，
// 彼此不直接调用、不读取手部关键点。
const AppBus = (function () {
    const handlers = {};   // { 事件名: [回调函数...] }

    return {
        // 订阅事件，返回取消订阅函数
        on(event, fn) {
            (handlers[event] = handlers[event] || []).push(fn);
            return () => this.off(event, fn);
        },
        // 取消订阅
        off(event, fn) {
            if (!handlers[event]) return;
            handlers[event] = handlers[event].filter(h => h !== fn);
        },
        // 发布事件：通知该事件的全部订阅者（复制一份，避免回调内增删导致错位）
        emit(event, payload) {
            (handlers[event] || []).slice().forEach(fn => {
                try { fn(payload); } catch (err) { console.error('事件 ' + event + ' 执行异常：', err); }
            });
        }
    };
})();
