import * as THREE from 'three';

export { ObjectPicker }

class ObjectPicker {

    raycaster: THREE.Raycaster;
    
    currentPosition: THREE.Vector2 | undefined;
    nextPosition: THREE.Vector2 | undefined;

    pickedObject: any | undefined;
    hoverObject: any | undefined;
    hoverObjectSavedColor: number

    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.currentPosition = undefined;
      this.nextPosition = undefined;
      this.pickedObject = null;
      this.hoverObject = null;
      this.hoverObjectSavedColor = 0;
    }

    clear_hover_highlight() {
        if (this.hoverObject && 'material' in this.hoverObject && 'emissive' in this.hoverObject.material) {
            this.hoverObject.material.emissive.setHex(this.hoverObjectSavedColor);
        }
    }

    clear_hover() {
        this.clear_hover_highlight();
        this.hoverObject = undefined;
    }
    
    update_selection(scene, camera) {
      if (this.nextPosition === this.currentPosition) {
        return;
      }
      this.currentPosition = this.nextPosition;

      if (this.currentPosition === undefined) {
        this.clear_hover();
        return;
      }

      // Cast a ray through the frustum
      this.raycaster.setFromCamera(this.currentPosition, camera);
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);

      // Handle intersections
      this.clear_hover();
      //console.log(intersectedObjects.length);
      //intersectedObjects.forEach((entry) => {console.log(entry)})
      if (intersectedObjects.length) {
        const closestObject = intersectedObjects[0].object;
        this.hoverObject = closestObject;
        if (closestObject !== this.pickedObject && 'material' in closestObject && 'emissive' in closestObject.material) {
            this.hoverObjectSavedColor = this.hoverObject.material.emissive.getHex();
            this.hoverObject.material.emissive.setRGB( 255/255 * 0.05, 191/256 * 0.05, 0 );
        }
      }
    }

    raycast(sceneContext, camera, pointThreshold: number = 0.01): any[] {
        if (this.currentPosition === undefined) {
            return [];
        }
        this.raycaster.params.Points.threshold = pointThreshold;

        this.raycaster.setFromCamera(this.currentPosition, camera);
        return this.raycaster.intersectObjects(sceneContext);
    }

    listenMouseEvent(window, canvas, onSelectCallback: Function | undefined = undefined, onActiveClickCallback: Function | undefined = undefined) {
        let picker = this;
        
        function getCanvasRelativePosition(event) {
            const rect = canvas.getBoundingClientRect();
            return {
            x: (event.clientX - rect.left) * canvas.width  / rect.width,
            y: (event.clientY - rect.top ) * canvas.height / rect.height,
            };
        }
    
        function setPickPosition(event) {
            const pos = getCanvasRelativePosition(event);
            picker.nextPosition = new THREE.Vector2(
                (pos.x / canvas.width ) *  2 - 1,
                (pos.y / canvas.height) * -2 + 1);
        }

        function clearPickPosition() {
            picker.nextPosition = undefined;
        }

        function select_active(event) {
            if (picker.hoverObject && 'name' in picker.hoverObject) {
                console.log("ActiveObject:", picker.hoverObject.name);
            } else {
                console.log("ActiveObject:", picker.hoverObject);
            }
            // Could perform intersection test 'on click' here..
            if (picker.pickedObject !== picker.hoverObject){
                picker.pickedObject = picker.hoverObject;
                picker.clear_hover_highlight();

                if (onSelectCallback) {
                    onSelectCallback(picker.pickedObject);
                }
            } else if(picker.pickedObject && onActiveClickCallback) {
                onActiveClickCallback(picker.pickedObject)
            }
        }

        window.addEventListener('click', select_active);
        window.addEventListener('mousemove', setPickPosition);
        window.addEventListener('mouseout', clearPickPosition);
        window.addEventListener('mouseleave', clearPickPosition);
    }
  }