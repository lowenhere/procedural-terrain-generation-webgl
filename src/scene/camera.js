import { mat4, quat, vec3, glMatrix } from "gl-matrix";

const Camera = {
    transform: {
        position: vec3.fromValues(0, 10, 20),
        rotation: vec3.fromValues(30, 180, 0),
        get quatRotation(){
            return Camera.computeRotationQuaternion();
        }
    },
    matrices: {
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
    controls: {
        deltaMouseX: 0,
        deltaMouseY: 0,
        inputKeys: {},
        mouseLocked: false,
        movementBindings: {
            'q': vec3.fromValues(0,1,0),
            'e': vec3.fromValues(0,-1,0),
            'w': vec3.fromValues(0,0,1),
            's': vec3.fromValues(0,0,-1),
            'a': vec3.fromValues(1,0,0),
            'd': vec3.fromValues(-1,0,0),
        }
    },
    init(aspectRatio, canvas) {
        //init camera properties
        this.properties.aspectRatio = aspectRatio;        

        //init projection matrix
        mat4.perspective(this.matrices.proj, this.properties.fieldOfView, this.properties.aspectRatio, this.properties.nearClipPlane, this.properties.farClipPlane);


        //========================================================================
        //
        //                            INIT CONTROLS                             
        //
        //========================================================================
        document.onmousemove = (event) => {
            this.controls.deltaMouseX += event.movementX;
            this.controls.deltaMouseY += event.movementY;
        }

        document.onkeydown = (event) => {
            this.controls.inputKeys[event.key] = true;
        }
        
        document.onkeyup = (event) => {
            this.controls.inputKeys[event.key] = false;
        }

        document.onmousedown = (event) => {
            let havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        
            if(havePointerLock) {
                if(this.mouseLocked) document.exitPointerLock();
                else canvas.requestPointerLock();
                this.controls.mouseLocked = !this.mouseLocked;
            }
        }


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
    },
    update(deltaTime) {
        //========================================================================
        //
        //                            ROTATE CAMERA                             
        //
        //========================================================================
        let deltaAngleHor = this.controls.deltaMouseX * Math.PI/10;
        let deltaAngleVert = this.controls.deltaMouseY * Math.PI/10;
        this.controls.deltaMouseX = 0;
        this.controls.deltaMouseY = 0;
        
        this.transform.rotation[1] -= deltaAngleHor;
        this.transform.rotation[0] = Math.min(89, Math.max(deltaAngleVert + this.transform.rotation[0], -89));

        //========================================================================
        //
        //                            MOVE CAMERA                             
        //
        //========================================================================
        for(let key in this.controls.movementBindings) {
            if(this.controls.inputKeys[key]) {
                let moveVector = vec3.create();
                
                //model space
                if(key == 'q' || key == 'e') {
                    moveVector = this.controls.movementBindings[key];
                }
                else {
                    //move inlocal space
                    vec3.transformQuat(moveVector, this.controls.movementBindings[key], this.transform.quatRotation);
                }
                
                let speedModifier = (this.controls.inputKeys[' '] ? 3 : 1);
                vec3.normalize(moveVector, moveVector);
                vec3.scale(moveVector, moveVector, this.moveSpeed * deltaTime * speedModifier);
                vec3.add(this.transform.position, this.transform.position, moveVector);
            }
        }
    },
}

export default Camera;