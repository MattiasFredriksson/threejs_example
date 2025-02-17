import * as THREE from 'three';
import {ObjectPicker} from './object_picker.ts';

export {ModalOPTransformGizmo}


const ORIGIN_RADIUS = 0.1;
const ORIGIN_NAME = "Origin";
const MOUSE_SPEED = 0.001;

function getRelativeMousePosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	return {
	x: (event.clientX - rect.left)  / rect.width,
	y: (event.clientY - rect.top ) / rect.height,
	};
}

class ModalOPTransformGizmo {

    sphere: THREE.Mesh;
    transformed_object: THREE.Object3D;
    poll: any;
    
    constructor(object: THREE.Object3D, scene) {
        const geometry = new THREE.SphereGeometry(0.06, 32, 16); 
        const material = new THREE.MeshBasicMaterial({color: new THREE.Color(1, 0.35, 0)});

        this.sphere = new THREE.Mesh(geometry, material);
        this.transformed_object = object;
        this.poll = undefined;

        this.sphere.name = ORIGIN_NAME;
        this.sphere.renderOrder = 10;
        material.depthTest = false;

        this.sphere.position.copy(object.position);
        
        scene.add(this.sphere);
    }
    
    dispose(scene){
        const previous = scene.getObjectByName(ORIGIN_NAME);
        if (previous) {
            scene.remove(previous);
        }
        window.removeEventListener('click', this.poll, { capture: true })
        this.sphere.geometry.dispose();
    }

    constructPoll(canvas, active_object: ObjectPicker, camera: THREE.Camera){
        let op = this;
        function poll(event){
            const mousePos = active_object.getCameraRelativeMousePosition(event, canvas);
            const intersects = active_object.raycast([op.sphere], camera, 0, mousePos);
            if (intersects.length == 0) {
                return
            }
            event.stopImmediatePropagation(); // Prevent triggering other listeners for this event.

            let initialState = {objectPos: op.transformed_object.position.clone()};
            active_object.mute();
            window.removeEventListener('click', op.poll, { capture: true });
            window.addEventListener('click', finalizeModalEdit);
            window.addEventListener('mousemove', updateObjectTransform);
        
            function updateObjectTransform(event){
                const rightAxis = new THREE.Vector3(camera.matrixWorld.elements[0], camera.matrixWorld.elements[1], camera.matrixWorld.elements[2]);
                const upAxis = new THREE.Vector3(camera.matrixWorld.elements[4], camera.matrixWorld.elements[5], camera.matrixWorld.elements[6]);
                const forwardAxis = new THREE.Vector3(-camera.matrixWorld.elements[8], -camera.matrixWorld.elements[9], -camera.matrixWorld.elements[10]);
                
                const camToObject = initialState.objectPos.clone().sub(camera.position);
                const distance = forwardAxis.dot(camToObject);

                const mousePos = getRelativeMousePosition(canvas, event);

                let screenY = Math.tan(camera.fov / 2 * Math.PI / 180) * distance;
                const screenX = screenY * camera.aspect * (mousePos.x - 0.5) * 2;
                screenY  *= (mousePos.y - 0.5) * 2;

                let position = camera.position.clone();
                position.add(forwardAxis.multiplyScalar(distance));
                position.add(upAxis.multiplyScalar(-screenY));
                position.add(rightAxis.multiplyScalar(screenX));

                op.transformed_object.position.copy(position);
                op.sphere.position.copy(position);
            }

            function finalizeModalEdit(event) {
                window.addEventListener('click', this.poll, { capture: true })
                window.removeEventListener('click', finalizeModalEdit);
                window.removeEventListener('mousemove', updateObjectTransform);
                active_object.unmute();
            }
        }
        return poll;
    }

    enablePoll(canvas, active_object: ObjectPicker, camera: THREE.Camera){
        this.poll = this.constructPoll(canvas, active_object, camera);
        window.addEventListener('click', this.poll, { capture: true })
    }
}