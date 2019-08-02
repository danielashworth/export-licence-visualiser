import React from 'react';
import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';

var scene, camera, renderer;
var sphere;

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 5;
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.enableZoom = false

}

function addEarth(radius, segmentWidth, segmentHeight) {

  var geometry = new THREE.SphereBufferGeometry(radius, segmentWidth, segmentHeight);
  
  var texture = new THREE.TextureLoader().load('/images/world_map.jpg');

  var material = new THREE.MeshBasicMaterial({
    map: texture
  });
  
  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
}

function animate() {
  requestAnimationFrame( animate );
  sphere.rotation.y += 0.005;
  renderer.render( scene, camera );
}

class Earth extends React.Component {

  constructor() { 
    super();
    setupScene();
    addEarth(2, 64, 64);
    animate();
  }

  render() {
    return <div></div>;
  }
}

export default Earth;