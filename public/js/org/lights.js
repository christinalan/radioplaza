function GeneralLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xff0024, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(0, 10, 5);
  scene.add(directionalLight);

  const d = 5;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 20;

  directionalLight.shadow.mapSize.x = 1024;
  directionalLight.shadow.mapSize.y = 1024;

  this.update = function (time) {
    ambientLight.intensity = (Math.sin(time) + 1.5) / 1.5;
    ambientLight.color.setHSL(Math.sin(time), 0.5, 0.5);
  };
}
