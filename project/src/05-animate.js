// ========== 动画循环 ==========
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 根据模式计算视觉级别与颜色（探索/创作共用长音视觉；学习模式用脉冲）
    let level, colorNote;
    if (mode === 'explore' || mode === 'create') {
        const t = activeNote ? 1 : 0;
        exploreLevel += (t - exploreLevel) * CONFIG.smoothSpeed;
        if (Math.abs(t - exploreLevel) < 0.002) exploreLevel = t;
        level = exploreLevel;
        colorNote = activeNote || 'do';
    } else {
        pulse += (0 - pulse) * 0.09;
        if (pulse < 0.002) pulse = 0;
        level = pulse;
        colorNote = pulseNote;
    }

    particleSphere.rotation.y += CONFIG.rotationSpeed;

    const spreadScale = 1 + level * CONFIG.spreadAmount;
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const idx = i * 3;
        const fx = Math.sin(time * 0.8 + offsets[idx])     * CONFIG.floatAmplitude * 0.3;
        const fy = Math.sin(time * 0.6 + offsets[idx + 1]) * CONFIG.floatAmplitude;
        const fz = Math.sin(time * 0.7 + offsets[idx + 2]) * CONFIG.floatAmplitude * 0.3;

        pos[idx]     = (originalPositions[idx]     + fx) * spreadScale;
        pos[idx + 1] = (originalPositions[idx + 1] + fy) * spreadScale;
        pos[idx + 2] = (originalPositions[idx + 2] + fz) * spreadScale;
    }
    geometry.attributes.position.needsUpdate = true;

    let target;
    if (mode === 'learn' && colorNote === 'err') target = colorErr;
    else target = NOTE_PARTICLE_COLORS[colorNote] || colorWarm;
    material.color.copy(colorWhite).lerp(target, level);
    material.size = CONFIG.particleSize * (1 + level * 0.7);
    material.opacity = 0.8 + level * 0.15;

    noteEl.style.opacity = (mode === 'explore' || mode === 'create') ? exploreLevel : 0;

    renderer.render(scene, camera);
}
animate();

