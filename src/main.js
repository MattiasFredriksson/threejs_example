import * as THREE from 'three';
import * as OBJECTS from './object_generators.ts';
import {ObjectPicker} from './object_picker.ts';
import {generateMeshVertexPointcloud} from './vertex_cloud.ts';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#c');
function getCanvasRelativePosition(event) {
	const rect = canvas.getBoundingClientRect();
	return {
	x: (event.clientX - rect.left) * canvas.width  / rect.width,
	y: (event.clientY - rect.top ) * canvas.height / rect.height,
	};
}

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
function onSelectCallback(event, object){
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

let selectedVertices = undefined;
function onActiveClickCallback(event, object){
	const intersects = active_object.raycast([pcloud], camera, POINT_RADIUS);
	if (intersects.length == 0) {
		return
	}

	let closeIndexSet = []
	const closestDistance = intersects[0].distance
	intersects.forEach((intersect) => {
		if (intersect.distance < closestDistance + 1e-7){
			const index = intersect.index * 3;
			closeIndexSet.push({index: index, co: object.geometry.attributes.position.array[index]});
		}
	});

	selectedVertices = {pos: getCanvasRelativePosition(event), object:object, indexSet: closeIndexSet};
	active_object.mute();
	window.addEventListener('click', finalizeModalEdit);
	window.addEventListener('mousemove', updateVertexPositions);
}

function updateVertexPositions(event){
	const pos = getCanvasRelativePosition(event);
	const mouseDeltaX = pos.x - selectedVertices.pos.x;
	selectedVertices.indexSet.forEach((entry) => {
		selectedVertices.object.geometry.attributes.position.array[entry.index] = entry.co + mouseDeltaX * 0.001;
	});
	selectedVertices.object.geometry.attributes.position.needsUpdate = true;
}

function finalizeModalEdit(event) {
	selectedVertices = undefined;
	window.removeEventListener('click', finalizeModalEdit);
	window.removeEventListener('mousemove', updateVertexPositions);
	active_object.unmute();
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