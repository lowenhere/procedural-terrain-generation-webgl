import { mat4 } from "gl-matrix";

export default class Transform {
    get modelMatrix(){ 
        return mat4.identity(new Float32Array(16));
    };
}