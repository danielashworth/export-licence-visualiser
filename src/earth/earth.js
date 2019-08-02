import React from 'react';
import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import { geoInterpolate } from 'd3-geo';

import * as data from '../data/exports.json';
import './earth.css';

var scene, camera, renderer;
var controls;

var earth;

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
  this.markers.push(marker);
  this.add(marker);
};

EarthObject.prototype.removeMarkers = function () {

  while(this.children.length > 1) {
    this.remove(this.children[1]);
  }

  this.markers = [];
};

EarthObject.prototype.markers = [];

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

function addSceneLighting() {
  var ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  var direcitonal = new THREE.DirectionalLight(0xffffff, 0.5);
  direcitonal.position.set(5.0, 2.0, 5.0).normalize();
  scene.add(direcitonal);  

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

function getExportValue(location) {

  var exportValue = parseFloat(location.value.replace(/,/g, ''));
  var exportRange;

  if(exportValue < 1000000) {
    exportRange = 'LOW';
  } else if(exportValue >= 1000000 && exportValue < 5000000) {
    exportRange = 'MEDIUM';
  } else {
    exportRange = 'HIGH';
  }

  return exportRange;
}

function getExportRoutes(earthObject, filterValue) {

  var sourceCoordinates = data.sourceLocation.coordinate;
  earthObject.createMarker(new Coordinate(sourceCoordinates.lat, sourceCoordinates.lon), '#ffffff');

  data.exportLocations.forEach(function(location) { 

    var exportValue = getExportValue(location);

    if((filterValue === 'ANY') || (filterValue === exportValue)) {

      var routeColour = getRouteColour(location.value);
      
      var coordinate = location.coordinate;

      earthObject.createMarker(new Coordinate(coordinate.lat, coordinate.lon), routeColour);

      var line = getExportRoute(new Coordinate(sourceCoordinates.lat, sourceCoordinates.lon), new Coordinate(coordinate.lat, coordinate.lon), routeColour);
      scene.add(line);
    }
  });
}

function populateScene(filterValue) {
  
  for( var i = scene.children.length - 1; i >= 0; i--) {
    scene.remove(scene.children[i]);
  }

  earth.removeMarkers();

  addSceneLighting();

  getExportRoutes(earth, filterValue);

  scene.add(earth);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

class Earth extends React.Component {

  constructor(props) { 
    super(props);
    
    this.state = {value: 'ANY'};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    
    setupScene();

    earth = getEarthObject();

    populateScene(this.state.value);
    animate();
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    populateScene(this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <div id="filter-pane">
        <h3>Filter</h3>
        <form onSubmit={this.handleSubmit}>
          <label>Contract value:</label>
          <select className="form-control" value={this.state.value} onChange={this.handleChange}>
            <option value="ANY">Any</option>
            <option value="LOW">&lt; £1,000,000</option>
            <option value="MEDIUM">&gt; £1,000,000 and &lt; £5,000,000</option>
            <option value="HIGH">&gt; £5,000,000</option>
          </select>
          <br/>
          <button type="submit" className="btn btn-primary">Filter</button>
        </form>
      </div>
    );
  }
}

export default Earth;