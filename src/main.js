import * as THREE from 'three';
import * as OBJECTS from './object_generators.ts';
import {ObjectPicker} from './object_picker.ts';
import {ModalOPVertexEdit} from './modal_op_vertex_edit.ts';
import {ModalOPTransformGizmo} from './modal_op_transform_gizmo.ts';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

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

let modalOp = null;
function onSelectCallback(event, object){
	if (modalOp) {
		modalOp.dispose(scene);
	}
	
	if (object) {
		// Create Vertex edit operator

		//modalOp = new ModalOPVertexEdit(object, scene);
		modalOp = new ModalOPTransformGizmo(object, scene);
	}
}

function onActiveClickCallback(event, object){
	if (modalOp) { // Should always be true..
		modalOp.poll(event, canvas, active_object, camera, object);
	}
}
active_object.listenMouseEvent(window, canvas, onSelectCallback, onActiveClickCallback);


suzanne = await suzanne;
function animate() {

	//suzanne.rotation.x += 0.001;
	//suzanne.rotation.y += 0.001;

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