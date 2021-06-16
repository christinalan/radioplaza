import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";

function createParticle() {
  const particles = [];
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/images/textures/Mpp4800.png");
  const pGeo = new THREE.SphereGeometry(0.5, 20, 32);
  pGeo.translate(0, 0, -20);
  const pMat = new THREE.MeshLambertMaterial({
    opacity: 0.7,
    transparent: true,
    map: texture,
  });

  for (let i = 0; i < 500; i++) {
    const particle = new THREE.Mesh(pGeo, pMat);
    const s = i / 2;
    particle.position.set(Math.random(s), Math.random(s), Math.sin(s));

    particles.push(particle);
  }

  return particles;
}

export { createParticle };
