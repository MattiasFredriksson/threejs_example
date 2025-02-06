import * as THREE from 'three';

export { ObjectPicker }

class ObjectPicker {

    raycaster: THREE.Raycaster;
    
    currentPosition: THREE.Vector2 | undefined;
    nextPosition: THREE.Vector2 | undefined;

    pickedObject: any | undefined;
    hoverObject: any | THREE.Mesh;
    hoverObjectMaterial: any | THREE.Material;

    muted: boolean;

    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.currentPosition = undefined;
      this.nextPosition = undefined;
      this.pickedObject = null;
      this.hoverObject = null;
      this.hoverObjectMaterial = null;
      this.muted = false;
    }

    mute(){
        this.muted = true;
    }

    unmute(){
        this.muted = false;
    }

    clear_hover_highlight() {
        if (this.hoverObject && this.hoverObjectMaterial && 'material' in this.hoverObject) {
            this.hoverObject.material.dispose();
            this.hoverObject.material = this.hoverObjectMaterial;
            this.hoverObject.material.needsUpdate = true;
        }
    }

    clear_hover() {
        this.clear_hover_highlight();
        this.hoverObject = undefined;
        this.hoverObjectMaterial = undefined;
    }
    
    update_selection(sceneContext, camera) {
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
      const intersectedObjects = this.raycaster.intersectObjects(sceneContext);

      // Handle intersections
      this.clear_hover();
      //console.log(intersectedObjects.length);
      //intersectedObjects.forEach((entry) => {console.log(entry)})
      if (intersectedObjects.length) {
        const closestObject = intersectedObjects[0].object;
        this.hoverObject = closestObject;
        if (closestObject !== this.pickedObject && 'material' in closestObject) {
            this.hoverObjectMaterial = closestObject.material;
            const materialCopy = closestObject.material.clone();
            materialCopy.emissive.setRGB( 1 * 0.05, 0.7 * 0.05, 0 );
            closestObject.material = materialCopy;
            closestObject.material.needsUpdate = true;
        }
      }
    }

    getCameraRelativeMousePosition(event, canvas){
        function getCanvasRelativePosition(event) {
            const rect = canvas.getBoundingClientRect();
            return {
            x: (event.clientX - rect.left) * canvas.width  / rect.width,
            y: (event.clientY - rect.top ) * canvas.height / rect.height,
            };
        }

        const pos = getCanvasRelativePosition(event);
        return new THREE.Vector2(
            (pos.x / canvas.width ) *  2 - 1,
            (pos.y / canvas.height) * -2 + 1);
    }

    raycast(sceneContext, camera, pointThreshold: number = 0.01, coord: THREE.Vector2 | undefined = undefined): any[] {
        if (coord === undefined) {
            coord = this.currentPosition;
        }
        if (coord === undefined) {
            return [];
        }
        this.raycaster.params.Points.threshold = pointThreshold;

        this.raycaster.setFromCamera(this.currentPosition, camera);
        return this.raycaster.intersectObjects(sceneContext);
    }

    listenMouseEvent(window, canvas, onSelectCallback: Function | undefined = undefined, onActiveClickCallback: Function | undefined = undefined) {
        let picker = this;
    
        function setPickPosition(event) {
            if (picker.muted) {
                return;
            }
            picker.nextPosition = picker.getCameraRelativeMousePosition(event, canvas);
        }

        function clearPickPosition() {
            if (picker.muted) {
                return;
            }
            picker.nextPosition = undefined;
        }

        function select_active(event) {
            if (picker.muted) {
                return;
            }
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
                    onSelectCallback(event, picker.pickedObject);
                }
            } else if(picker.pickedObject && onActiveClickCallback) {
                onActiveClickCallback(event, picker.pickedObject)
            }
        }

        window.addEventListener('click', select_active);
        window.addEventListener('mousemove', setPickPosition);
        window.addEventListener('mouseout', clearPickPosition);
        window.addEventListener('mouseleave', clearPickPosition);
    }
  }