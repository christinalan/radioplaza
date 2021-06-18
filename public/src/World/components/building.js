import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";

function createFloor() {
  const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.5,
    transparent: true,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.position.y = -100;
  floor.receiveShadow = true;

  return floor;
}

function createMainHall() {
  const walls = [];
  const vertex = new THREE.Vector3();
  const color = new THREE.Color();

  let wGeo = new THREE.PlaneGeometry(500, 200, 100, 100);
  wGeo.translate(0, 50, 0);
  wGeo.rotateY(Math.PI / 2);

  //adding some vertex variation to walls
  let position = wGeo.attributes.position;

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 1 - 2;
    vertex.y += Math.random() * 1;
    vertex.z += Math.random() * 2;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  wGeo = wGeo.toNonIndexed();

  position = wGeo.attributes.position;
  const colorsFloor = [];

  for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.01, 0.75, Math.random() * 0.15 + 0.01);
    colorsFloor.push(color.r, color.g, color.b);
  }

  wGeo.setAttribute("color", new THREE.Float32BufferAttribute(colorsFloor, 3));

  const wMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  const wall = new THREE.Mesh(wGeo, wMaterial);
  const wall2 = new THREE.Mesh(wGeo, wMaterial);
  wall.position.set(-10, 0, 0);
  wall2.position.set(10, 0, 0);

  walls.push(wall, wall2);

  return walls;
}

function createDoors() {
  const doors = [];

  const dGeo = new THREE.BoxGeometry(8, 25, 1);
  dGeo.rotateY(Math.PI / 2);
  const dMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  const door = new THREE.Mesh(dGeo, dMat);
  door.position.set(-11.5, 15, -20);

  const door1 = new THREE.Mesh(dGeo, dMat);
  door1.position.set(-11.5, 15, -140);

  doors.push(door, door1);
  return doors;
}

function createWalls() {
  const otherwalls = [];
  const smallGeo = new THREE.PlaneGeometry(150, 250);

  const wMat = new THREE.MeshBasicMaterial({
    // color: 0x6800005,
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.2,
  });

  //left wall
  const wall = new THREE.Mesh(smallGeo, wMat);
  wall.position.set(-90, 50, 100);

  //2nd wall to the right
  const wall1 = new THREE.Mesh(smallGeo, wMat);
  wall1.position.set(-90, 50, -110);

  //ceiling ?
  const ceiling = new THREE.Mesh(smallGeo, wMat);
  ceiling.position.set(-90, 150, 0);
  ceiling.rotation.set(Math.PI / 2, 0, 0);

  otherwalls.push(wall, wall1, ceiling);

  return otherwalls;
}

export { createFloor, createMainHall, createDoors, createWalls };
