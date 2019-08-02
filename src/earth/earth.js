import React from 'react';
import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import { geoInterpolate } from 'd3-geo';

import * as data from '../data/exports.json';

var scene, camera, renderer;
var controls;

const EARTH_RADIUS = 1.0;
const DEGREE_TO_RADIAN = Math.PI / 180;

function Marker(colour) {
  THREE.Object3D.call(this);

  var radius = 0.005;
  var sphereRadius = 0.02;
  var height = 0.05;

  var material = new THREE.MeshPhongMaterial({ color: colour });

  var cone = new THREE.Mesh(new THREE.ConeBufferGeometry(radius, height, 8, 1, true), material);
  cone.position.y = height * 0.5;
  cone.rotation.x = Math.PI;

  var sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(sphereRadius, 16, 8), material);
  sphere.position.y = height * 0.95 + sphereRadius;

  this.add(cone, sphere);
}

Marker.prototype = Object.create(THREE.Object3D.prototype);

function EarthObject(radius, texture) {
  THREE.Object3D.call(this);

  var earth = new THREE.Mesh(
      new THREE.SphereBufferGeometry(radius, 64.0, 48.0),
      new THREE.MeshPhongMaterial({
          map: texture
      })
  );

  this.add(earth);
}

function convertCoordinateToSpherePoints(coordinate, radius) {
  var latRad = convertToRadians(coordinate.lat);
  var lonRad = convertToRadians(-coordinate.lon);
  var r = EARTH_RADIUS;

  return [Math.cos(latRad) * Math.cos(lonRad) * r, Math.sin(latRad) * r, Math.cos(latRad) * Math.sin(lonRad) * r];
}

function convertToRadians(catesianPoint) {
  return catesianPoint * DEGREE_TO_RADIAN;
}

function createCoordinateMarker(coordinate, colour) {
  var marker = new Marker(colour);
  
  var latRad = convertToRadians(coordinate.lat);
  var lonRad = convertToRadians(-coordinate.lon);
  var point = convertCoordinateToSpherePoints(coordinate, EARTH_RADIUS);

  marker.position.set(point[0], point[1], point[2]);
  marker.rotation.set(0.0, -lonRad, latRad - Math.PI * 0.5);

  return marker;
}

EarthObject.prototype = Object.create(THREE.Object3D.prototype);

EarthObject.prototype.createMarker = function (coordinate, colour) {
  var marker = createCoordinateMarker(coordinate, colour);
  this.add(marker);
};

function setupScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 100);
  camera.position.set(0.0, 1.5, 3.0);

  renderer = new THREE.WebGLRenderer({ antialias: true });

  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = -1.0;
  controls.enablePan = false;

  var ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  var direcitonal = new THREE.DirectionalLight(0xffffff, 0.5);
  direcitonal.position.set(5.0, 2.0, 5.0).normalize();
  scene.add(direcitonal);  

  window.addEventListener('resize', onResize);
  onResize();

  document.body.appendChild(renderer.domElement);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function getEarthObject() {
  var texture = new THREE.TextureLoader().load('/images/world_map.jpg');
  return new EarthObject(1.0, texture);
}

function Coordinate(lat, lon) {
  this.lat = lat
  this.lon = lon;
}

function getExportRoute(startCoordinate, endCoordinate, colour) {
  var start = convertCoordinateToSpherePoints(startCoordinate);
  var end = convertCoordinateToSpherePoints(endCoordinate);

  const interpolate = geoInterpolate([startCoordinate.lon, startCoordinate.lat], [endCoordinate.lon, endCoordinate.lat]);
  const midCoord1 = interpolate(0.25);
  const midCoord2 = interpolate(0.75);
  const mid1 = convertCoordinateToSpherePoints(new Coordinate(midCoord1[1], midCoord1[0]), EARTH_RADIUS + 20);
  const mid2 = convertCoordinateToSpherePoints(new Coordinate(midCoord2[1], midCoord2[0]), EARTH_RADIUS + 20);

  var curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(start[0], start[1], start[2]),
    new THREE.Vector3(mid1[0]*1.5, mid1[1]*1.5, mid1[2]*1.5),
    new THREE.Vector3(mid2[0]*1.5, mid2[1]*1.5, mid2[2]*1.5),
    new THREE.Vector3(end[0], end[1], end[2])
  );
  
  var points = curve.getPoints( 50 );
  var geometry = new THREE.BufferGeometry().setFromPoints( points );
  
  var material = new THREE.LineBasicMaterial( { color : colour } );
  
  // Create the final object to add to the scene
  return new THREE.Line( geometry, material );
  
}

function getRouteColour(exportValue) {

  var colour;

  exportValue = parseFloat(exportValue.replace(/,/g, ''));

  if(exportValue < 1000000) {
    colour = '#00ff00';
  } else if (exportValue >= 1000000 && exportValue < 5000000) {
    colour = '#ff8c00';
  }
  else {
    colour = '#ff0000';
  }

  return colour;
}

function getExportRoutes(earthObject) {

  var sourceCoordinates = data.sourceLocation.coordinate;
  earthObject.createMarker(new Coordinate(sourceCoordinates.lat, sourceCoordinates.lon), '#ffffff');

  data.exportLocations.forEach(function(location) { 

    var routeColour = getRouteColour(location.value);
    console.log(routeColour);
    
    var coordinate = location.coordinate;

    earthObject.createMarker(new Coordinate(coordinate.lat, coordinate.lon), routeColour);

    var line = getExportRoute(new Coordinate(sourceCoordinates.lat, sourceCoordinates.lon), new Coordinate(coordinate.lat, coordinate.lon), routeColour);
    scene.add(line);
  });
}

function populateScene() {
  var earth = getEarthObject();
  getExportRoutes(earth);
  scene.add(earth);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

class Earth extends React.Component {

  constructor() { 
    super();
    setupScene();
    populateScene();
    animate();
  }

  render() {
    return <div></div>;
  }
}

export default Earth;