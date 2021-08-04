import loadObjString from "./utils/obj-loader";

class OBJMesh {
    /**
     * OBJMesh constructor
     * @param {WebGLProgram} program 
     * @param {WebGL2RenderingContext} gl 
     * @param {String} objString raw .obj file string
     */
    constructor(program, gl, objString) {
        this.program = program;
        this.gl = gl;

        // TODO: should probably find a better name for this ...
        this.object = loadObjString(objString);

        // create and bind vertex array object
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // create and bind vertex buffers 
        const vbo = gl.createBuffer();
        const vertices = this.object.vertices.flat(); // this.object.vertices is 2D, so we flatten it
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // create and bind index buffers 
        const ibo = gl.createBuffer();
        const faces = this.object.faces.flat(); // this.object.faces is 2D, so we flatten it
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);

        gl.useProgram(program);

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

        this.locations = {
            uniform: {
                world: gl.getUniformLocation(program, 'mWorld'),
                view: gl.getUniformLocation(program, 'mView'),
                proj: gl.getUniformLocation(program, 'mProj'),
            }
        };

    }

    /**
     * Renders the mesh
     * @param {mat4} mWorld
     * @param {mat4} mView
     * @param {mat4} mProj
     */
    render(mWorld, mView, mProj) {
        const { gl, locations } = this;

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(locations.uniform.world, gl.FALSE, mWorld);
        gl.uniformMatrix4fv(locations.uniform.view, gl.FALSE, mView);
        gl.uniformMatrix4fv(locations.uniform.proj, gl.FALSE, mProj);
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.object.faces.length, gl.UNSIGNED_SHORT, 0);
    }

}

export default OBJMesh;
