import * as THREE from 'three';
import * as OBJECTS from './object_generators.ts';
import {ObjectPicker} from './object_picker.ts';
import {generateMeshVertexPointcloud} from './vertex_cloud.ts';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const POINT_RADIUS = 0.03;

const scene = new THREE.Scene();
const loader = new GLTFLoader();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const controls = new OrbitControls(camera, canvas);
const active_object = new ObjectPicker();

camera.position.z = 5;
controls.target.set(0, 0, 0);
controls.update();

let suzanne = OBJECTS.ensure_gltf_object(loader, '/Suzanne.glb', scene);
scene.add(OBJECTS.create_default_light(new THREE.Vector3(-0.3, -1, -0.3)));

// Create vertex cloud
let pcloud = null;
function onSelectCallback(object){
	const cloud_name = "VertexCloud"
	const previous = scene.getObjectByName(cloud_name);
	if (previous) {
		scene.remove(previous);
	}
	if (object) {
		pcloud = generateMeshVertexPointcloud(object, new THREE.Color(1.0, 0.0, 0.0), POINT_RADIUS);
		pcloud.name = cloud_name;
		// Fake parenting, preferable this should be done without sharing matrix object...
		// But will do for now, this simplifies filtering object picking.
		pcloud.applyMatrix4(object.matrixWorld)
		pcloud.matrix = object.matrixWorld;
		pcloud.matrixAutoUpdate = false; // Disable, cant modify the transform object!!!
		scene.add(pcloud);
	}
}

function onActiveClickCallback(object){
	intersects = active_object.raycast([pcloud], camera, POINT_RADIUS);

	
}

active_object.listenMouseEvent(window, canvas, onSelectCallback, onActiveClickCallback);

suzanne = await suzanne;
function animate() {

	//suzanne.rotation.x += 0.01;
	//suzanne.rotation.y += 0.01;

	active_object.update_selection(suzanne, camera);
	
	renderer.render( scene, camera );
}

function handle_mesh(mesh) {
	console.log("Mesh:", mesh.name);
}

function recurse_objects(set){
	set.forEach((child) => {
		if (child instanceof THREE.Mesh){
			handle_mesh(child)
		}else{
			recurse_objects(child.children);
		}
	});
}
recurse_objects(scene.children)


renderer.setAnimationLoop( animate );