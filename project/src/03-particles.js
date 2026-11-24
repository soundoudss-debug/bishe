// ========== 球形粒子系统 ==========
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(CONFIG.particleCount * 3);
const originalPositions = new Float32Array(CONFIG.particleCount * 3);
const offsets = new Float32Array(CONFIG.particleCount * 3);

for (let i = 0; i < CONFIG.particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = CONFIG.sphereRadius + (Math.random() - 0.5) * CONFIG.shellThickness;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
    originalPositions[i*3] = x; originalPositions[i*3+1] = y; originalPositions[i*3+2] = z;

    offsets[i*3] = Math.random() * Math.PI * 2;
    offsets[i*3+1] = Math.random() * Math.PI * 2;
    offsets[i*3+2] = Math.random() * Math.PI * 2;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: CONFIG.particleSize,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const particleSphere = new THREE.Points(geometry, material);
scene.add(particleSphere);

