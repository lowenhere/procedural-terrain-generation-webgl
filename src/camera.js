import { mat4, quat, vec3, glMatrix } from "gl-matrix";

const Camera = {
    transform: {
        position: vec3.fromValues(0, 5, 12),
        rotation: vec3.fromValues(20, 180, 0),
        get quatRotation(){
            return Camera.computeRotationQuaternion();
        }
    },
    matrices: {
        world: new Float32Array(16),
        //compute view matrix
        get view(){
            return Camera.computeViewMatrix();
        },
        proj: new Float32Array(16),
    },
    properties: {
        fieldOfView: glMatrix.toRadian(45),
        nearClipPlane: 0.1,
        farClipPlane: 1000,
        aspectRatio: 1
    },
    moveSpeed: 3,
    init(aspectRatio) {
        //init camera properties
        this.properties.aspectRatio = aspectRatio;

        //init world matrix
        mat4.identity(this.matrices.world);

        //init projection matrix
        mat4.perspective(this.matrices.proj, this.properties.fieldOfView, this.properties.aspectRatio, this.properties.nearClipPlane, this.properties.farClipPlane);
    },
    computeRotationQuaternion() {
        let cameraQuaternionRotation = quat.create();
        quat.fromEuler(cameraQuaternionRotation, this.transform.rotation[0], this.transform.rotation[1], this.transform.rotation[2]);
        return cameraQuaternionRotation;
    },
    computeViewMatrix(){
        let viewMatrix = new Float32Array(16);
        const up = vec3.fromValues(0, 1, 0);
        // const forward = vec3.fromValues(0, 0, 1);        
        let forward = vec3.fromValues(0, 0, 1);

        //get look direction
        let cameraLookDir = vec3.create();
        vec3.transformQuat(cameraLookDir, forward, this.transform.quatRotation);
        
        //get look point
        let lookAtPoint = vec3.create();
        vec3.add(lookAtPoint, this.transform.position, cameraLookDir);

        //compute view matrix
        mat4.lookAt(viewMatrix, this.transform.position, lookAtPoint, up);
        return viewMatrix;
    }
}

export default Camera;