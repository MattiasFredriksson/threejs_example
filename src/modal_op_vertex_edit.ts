import * as THREE from 'three';
import {ObjectPicker} from './object_picker.ts';

export {ModalOPVertexEdit}


const POINT_RADIUS = 0.04;
const VCLOUD_NAME = "VertexCloud"

function getCanvasRelativePosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	return {
	x: (event.clientX - rect.left) * canvas.width  / rect.width,
	y: (event.clientY - rect.top ) * canvas.height / rect.height,
	};
}

function generateMeshVertexPointcloud( mesh: THREE.Mesh, color: THREE.Color, pointSize: number ): THREE.Points {

    const geometry = mesh.geometry;
    const material = new THREE.PointsMaterial( { size: pointSize, vertexColors: false } );
    material.color = color;

    return new THREE.Points( geometry, material );
}

class VertexEntry {

    co: number;
    index: number;

    constructor(index: number, co: number) {
        this.index = index;
        this.co = co;
    }
}

class ModalOPVertexEdit {

    pointCloud: THREE.Points;
    poll: any;
    edited_object: THREE.Mesh;

    constructor(mesh: THREE.Mesh, scene) {
      this.poll = undefined;
      this.edited_object = mesh;

      this.pointCloud = generateMeshVertexPointcloud(mesh, new THREE.Color(1.0, 0.0, 0.0), POINT_RADIUS);
      this.pointCloud.name = VCLOUD_NAME;
      // Fake parenting, preferable this should be done without sharing matrix object...
      // But will do for now, this simplifies filtering object picking.
      this.pointCloud.applyMatrix4(mesh.matrixWorld)
      this.pointCloud.matrix = mesh.matrixWorld;
      this.pointCloud.matrixAutoUpdate = false; // Disable, cant modify the transform object!!!
      scene.add(this.pointCloud);
    }

    dispose(scene){
        const previous = scene.getObjectByName(VCLOUD_NAME);
        if (previous) {
            scene.remove(previous);
        }
        window.removeEventListener('click', this.poll, { capture: true })
        this.pointCloud.geometry.dispose();
    }

    constructPoll(canvas, active_object: ObjectPicker, camera: THREE.Camera){
        let op = this;
        function poll(event){
            const mousePos = active_object.getCameraRelativeMousePosition(event, canvas);
            const intersects = active_object.raycast([op.pointCloud], camera, POINT_RADIUS, mousePos);
            if (intersects.length == 0) {
                return
            }
            event.stopImmediatePropagation(); // Prevent triggering other listeners for this event.
            window.removeEventListener('click', op.poll, { capture: true });
            active_object.mute();

            // If intersecting, enter modal state:
            let closeIndexSet: VertexEntry[] = [];
            const closestDistance = intersects[0].distance
            intersects.forEach((intersect) => {
                if (intersect.distance < closestDistance + 1e-7){
                    const index = intersect.index * 3;
                    closeIndexSet.push(new VertexEntry(index, op.edited_object.geometry.attributes.position.array[index]));
                }
            });
        
            let selectedVertices = {pos: getCanvasRelativePosition(canvas, event), indexSet: closeIndexSet};
            window.addEventListener('click', finalizeModalEdit);
            window.addEventListener('mousemove', updateVertexPositions);
            function updateVertexPositions(event){
                const pos = getCanvasRelativePosition(canvas, event);
                const mouseDeltaX = pos.x - selectedVertices.pos.x;
                selectedVertices.indexSet.forEach((entry) => {
                    op.edited_object.geometry.attributes.position.array[entry.index] = entry.co + mouseDeltaX * 0.001;
                });
                op.edited_object.geometry.attributes.position.needsUpdate = true;
            }
    
            function finalizeModalEdit(event) {
                window.removeEventListener('click', finalizeModalEdit);
                window.removeEventListener('mousemove', updateVertexPositions);
                window.addEventListener('click', op.poll, { capture: true });
                active_object.unmute();
            }
        }
        return poll;
    }

    enablePoll(canvas, active_object: ObjectPicker, camera: THREE.Camera){
        this.poll = this.constructPoll(canvas, active_object, camera);
        window.addEventListener('click', this.poll, { capture: true });
    }
}
