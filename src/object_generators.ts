import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export { create_default_light, load_gltf_object, ensure_gltf_object, promise_gltf_object }

function create_default_light(dir: THREE.Vector3) {
    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);

    const loc = dir.multiplyScalar(-1000.0);
    light.position.set(loc.x, loc.y, loc.z);
    return light
}

/**
 * Creates a new default scene object group.
 */
function create_default_object() : THREE.Group {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000} );
    
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0);

    const group = new THREE.Group();
    group.add(cube);

    return group;
}

function common_load_callback(onLoadContext: THREE.Scene | any, group: THREE.Group){
    if (onLoadContext instanceof THREE.Scene){
        onLoadContext.add(group);
    }
    else if(onLoadContext !== undefined) {
        onLoadContext(group);
    }
}


/**
 * Load a gltf object as a promise.
 * 
 * @param loader Loader instance.
 * @param path URL path to the glb/gltf file to load.
 * @param onLoadContext Optional argument taking a scene context or callback for the loaded THREE.Group object.
 * @returns Promise of a loaded object.
 */
function promise_gltf_object(loader: GLTFLoader, urlPath: string, onLoadContext: THREE.Scene | any = undefined): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        loader.load(
            urlPath,
        (gltf) => {
            let group = gltf.scene;
            common_load_callback(onLoadContext, group);
            resolve(group);
        },  
        undefined,
        (error) => {
            console.error('Failed to load gltf:', error);
            reject(error);
        }
        );
    });
}

/**
 * Asynchronous load a gltf object, 'guaranteeing' to return a default object if load fails.
 * 
 * @param loader See related function.
 * @param urlPath 
 * @param onLoadContext 
 * @returns 
 */
function ensure_gltf_object(loader: GLTFLoader, urlPath: string, onLoadContext: THREE.Scene | any = undefined): Promise<THREE.Group> {
    return promise_gltf_object(loader, urlPath, onLoadContext)
      .catch((error) => {
        let group = create_default_object();
        common_load_callback(onLoadContext, group);
        return group;
      })
}