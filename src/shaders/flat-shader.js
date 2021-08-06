import glUtils from "../utils/gl-utils";

const FlatShader = {
    /** @type {WebGLProgram} */
    program: undefined,
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    init(gl) {
        let vertexShader = glUtils.createShader(this.vertexShaderText, gl.VERTEX_SHADER, gl);
        let fragmentShader = glUtils.createShader(this.fragmentShaderText, gl.FRAGMENT_SHADER, gl);        
        this.program = glUtils.createProgramWithShaders([vertexShader, fragmentShader], gl);
    },
    vertexShaderText: `#version 300 es
    precision mediump float;
    
    in vec3 vertPosition;
    in vec3 vertColor;
    
    uniform bool clipEnabled;
    uniform mat4 mNormal;
    uniform mat4 mModel;
    uniform mat4 mView;
    uniform mat4 mProj;
    
    out vec4 fragColor;
    out vec4 vertexWorldSpace;
    out float clip;
    const vec4 clippingPlane = vec4(0, 1, 0, 0.15);
    
    void main()
    {   
        if(clipEnabled == true) {
            clip = dot(mModel * vec4(vertPosition, 1.0), clippingPlane);
        }
        else {
            clip = 1.0;
        }
        vec3 offset = vec3(0.0, 0.0, 0.0) * 0.2;
        fragColor = vec4(vertColor, 1.0);    
        vertexWorldSpace = mModel * vec4(vertPosition + offset, 1.0);;
        gl_Position = mProj * mView * vertexWorldSpace;
    }
    `,
    fragmentShaderText: `#version 300 es
    // #extension GL_OES_standard_derivatives : enable
    precision mediump float;
    
    in float clip;
    in vec4 vertexWorldSpace;
    in vec4 fragColor;
    
    uniform vec3 directionalLightColor;
    uniform vec3 directionalLightVector;
    
    out vec4 outputColor;
    
    void main()
    {
        if(clip < 0.0) 
        {
            discard;
        }
    
        vec3 U = dFdx(vertexWorldSpace.xyz);
        vec3 V = dFdy(vertexWorldSpace.xyz);
        vec3 normal = normalize(cross(U,V));
    
        //diffuse
        highp float directional = max(dot(normal.xyz, -directionalLightVector), 0.0);
        vec3 vLighting = (directionalLightColor * directional);
    
        //ambient
        vec3 ambient = directionalLightColor * 0.1;
    
        outputColor = vec4(fragColor.xyz * vLighting + ambient, 1.0);
    }
    `,
}

export default FlatShader;