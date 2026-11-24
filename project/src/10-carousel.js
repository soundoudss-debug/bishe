// ========== 左下角七手势指导图轮播（图片与文字条同步） ==========
const GD_CAPTIONS = ['Do-五指','Re-拇指','Mi-食指','Fa-食中指','Sol-三指','La-四指','Si-小指'];
const gdImgs = document.querySelectorAll('#gesture-demo img');
const gdCaptionEl = document.getElementById('gd-caption');
let gdIndex = 0;
setInterval(() => {
    gdImgs[gdIndex].classList.remove('show');
    gdIndex = (gdIndex + 1) % gdImgs.length;
    gdImgs[gdIndex].classList.add('show');
    gdCaptionEl.textContent = GD_CAPTIONS[gdIndex];
}, 1600);

