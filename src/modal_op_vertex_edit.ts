import * as THREE from 'three';
import {ObjectPicker} from './object_picker.ts';

export {ModalOPVertexEdit}


const POINT_RADIUS = 0.03;
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

    constructor(mesh: THREE.Mesh, scene) {

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
    }

    poll(event, canvas, active_object: ObjectPicker, camera, object: THREE.Mesh){
        const intersects = active_object.raycast([this.pointCloud], camera, POINT_RADIUS);
        if (intersects.length == 0) {
            return
        }

        // If intersection, enter modal state:
    
        let closeIndexSet: VertexEntry[] = [];
        const closestDistance = intersects[0].distance
        intersects.forEach((intersect) => {
            if (intersect.distance < closestDistance + 1e-7){
                const index = intersect.index * 3;
                closeIndexSet.push(new VertexEntry(index, object.geometry.attributes.position.array[index]));
            }
        });
    
        let selectedVertices = {pos: getCanvasRelativePosition(canvas, event), object:object, indexSet: closeIndexSet};
        active_object.mute();
        window.addEventListener('click', finalizeModalEdit);
        window.addEventListener('mousemove', updateVertexPositions);
        

        function updateVertexPositions(event){
            const pos = getCanvasRelativePosition(canvas, event);
            const mouseDeltaX = pos.x - selectedVertices.pos.x;
            selectedVertices.indexSet.forEach((entry) => {
                selectedVertices.object.geometry.attributes.position.array[entry.index] = entry.co + mouseDeltaX * 0.001;
            });
            selectedVertices.object.geometry.attributes.position.needsUpdate = true;
        }

        function finalizeModalEdit(event) {
            window.removeEventListener('click', finalizeModalEdit);
            window.removeEventListener('mousemove', updateVertexPositions);
            active_object.unmute();
        }
    }
}
