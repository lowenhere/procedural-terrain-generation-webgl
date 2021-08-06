import { mat4, quat, vec3 } from "gl-matrix";

export default class Transform {
    
    constructor(position=vec3.fromValues(0, 0, 0), rotation=vec3.fromValues(0, 0, 0), scale=vec3.fromValues(1, 1, 1)) {
        let self = this;
        this.transform = {
            position,
            rotation,
            scale,
            get quatRotation(){
                return self.computeRotationQuaternion();
            }
        };
    }

    computeRotationQuaternion() {
        let cameraQuaternionRotation = quat.create();
        quat.fromEuler(cameraQuaternionRotation, this.transform.rotation[0], this.transform.rotation[1], this.transform.rotation[2]);
        return cameraQuaternionRotation;
    };

    get modelMatrix(){ 
        let modelMat = new Float32Array(16);
        // mat4.identity(modelMat);
        mat4.fromRotationTranslationScale(modelMat, this.transform.quatRotation, this.transform.position, this.transform.scale);
        return modelMat;
    };
}