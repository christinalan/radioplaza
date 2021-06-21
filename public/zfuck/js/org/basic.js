function SceneSubject(scene) {
  //floor
  const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.5,
    transparent: true,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);
}
