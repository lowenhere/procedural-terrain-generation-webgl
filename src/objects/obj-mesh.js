import loadObjString from "../utils/obj-loader";
import loadMtlString from "../utils/mtl-loader";
import Camera from "../scene/camera";
import Transform from "./transform";
import { mat4 } from "gl-matrix";

class OBJMesh extends Transform {

    locations = {
        uniform: {
            mModel: undefined,
            mView: undefined,
            mProj: undefined,
            clipEnabled: undefined,
        }
    };
    
    /**
     * OBJMesh constructor
     * @param {WebGLProgram} program 
     * @param {WebGL2RenderingContext} gl 
     * @param {String} objString raw .obj file string
     * @param {String} mtlString raw .mtl file string
     * @param {Array<Number>} defaultColor default color value for vertices
     */
    constructor(program, gl, objString, mtlString = undefined, transform={}, defaultColor = [0.8, 0.0, 0.0, 1.0]) {
        super(transform.position, transform.rotation, transform.scale);
        this.program = program;
        this.gl = gl;
        this.defaultColor = defaultColor;

        // TODO: should probably find a better name for this ...
        this.object = loadObjString(objString);
        this.materials = {};

        // load mtl string if it exists
        if (mtlString) {
            const materialList = loadMtlString(mtlString);
            materialList.forEach(m => { this.materials[m.name] = m });
        }

        // console.log(this.object);
        // console.log(this.materials);

        // set up color buffer data
        const colors = [];
        this.object.vertexMaterials.forEach(matName => {
            if (!this.materials[matName]) {
                colors.push(...defaultColor);
                return
            }
            
            colors.push(...this.materials[matName]["Kd"]);
        });

        // console.log(colors);

        // create and bind vertex array object
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // create and bind vertex buffers
        // position buffer
        const posVbo = gl.createBuffer();
        const vertices = this.object.vertices.flat(); // this.object.vertices is 2D, so we flatten it
        gl.bindBuffer(gl.ARRAY_BUFFER, posVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // normal buffer
        const normVbo = gl.createBuffer();
        const normals = this.object.vertexNormals.flat();
        gl.bindBuffer(gl.ARRAY_BUFFER, normVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // color buffer
        const colorVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // create and bind index buffers
        const ibo = gl.createBuffer();
        const faces = this.object.faces.flat(); // this.object.faces is 2D, so we flatten it
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);

        gl.useProgram(program);

        // define vertex attrib data for positions
        gl.bindBuffer(gl.ARRAY_BUFFER, posVbo);
        const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, // attribute location
            3, // elements per attribute
            gl.FLOAT, // element type
            gl.FALSE, // to normalize
            3 * Float32Array.BYTES_PER_ELEMENT, // stride
            0 // offset
        );
        gl.enableVertexAttribArray(positionAttribLocation);

        // define vertex attrib data for normals
        // gl.bindBuffer(gl.ARRAY_BUFFER, normVbo);
        // const normAttribLocation = gl.getAttribLocation(program, 'vertNormal');
        // gl.vertexAttribPointer(
        //     normAttribLocation, // attribute location
        //     3, // elements per attribute
        //     gl.FLOAT, // element type
        //     gl.FALSE, // to normalize
        //     3 * Float32Array.BYTES_PER_ELEMENT, // stride
        //     0 // offset
        // );
        // gl.enableVertexAttribArray(normAttribLocation);

        // define vertex attrib data for colors
        gl.bindBuffer(gl.ARRAY_BUFFER, colorVbo);
        const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
        gl.vertexAttribPointer(
            colorAttribLocation, // attribute location
            3, // elements per attribute
            gl.FLOAT, // element type
            gl.FALSE, // to normalize
            3 * Float32Array.BYTES_PER_ELEMENT, // stride
            0 // offset
        );
        gl.enableVertexAttribArray(colorAttribLocation);

        //LINK ALL UNIFORM LOCATIONS
        for(let key in this.locations.uniform) {
            this.locations.uniform[key] = gl.getUniformLocation(program, key);
        }
    }

    render(camera, clipEnabled=false) {
        const { gl, locations } = this;

        gl.useProgram(this.program);
        gl.uniform1i(this.locations.uniform.clipEnabled, clipEnabled);
        gl.uniformMatrix4fv(locations.uniform.mModel, gl.FALSE, this.modelMatrix);
        gl.uniformMatrix4fv(locations.uniform.mView, gl.FALSE, camera.matrices.view);
        gl.uniformMatrix4fv(locations.uniform.mProj, gl.FALSE, camera.matrices.proj);
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, 3 * this.object.faces.length, gl.UNSIGNED_SHORT, 0);
    }

}

export default OBJMesh;
