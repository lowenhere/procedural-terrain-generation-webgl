import glUtils from "../utils/gl-utils";

const WaterShader = {
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
    
    uniform float time;
    uniform mat4 mModel;
    uniform mat4 mView;
    uniform mat4 mProj;
    uniform vec3 cameraPosition;
    uniform float maxVertexOscillation;
    uniform float dudvTiling;
    uniform float oscillationScale;
    
    out vec3 toCameraVector;
    out vec4 color;
    out vec4 vertPositionAfterOffset;
    out vec4 clipSpacePreOffset;
    out vec2 dudvTextureCoordinates;
    
    
    void main()
    {
        mat4 _m = mProj * mView * mModel;
        vec3 offset = vec3(0.0, sin(time + vertPosition[0]*oscillationScale) + cos(time + vertPosition[2]*oscillationScale), 0.0) * maxVertexOscillation;
        color = vec4(vertColor, 1.0);        
        clipSpacePreOffset = _m * vec4(vertPosition, 1.0);
        
        vertPositionAfterOffset = vec4(vertPosition + offset, 1.0);;
        gl_Position = _m * vertPositionAfterOffset;
        dudvTextureCoordinates = vec2(vertPosition.x/2.0 + 0.5, vertPosition.z/2.0 + 0.5) * dudvTiling;
    
        toCameraVector = (cameraPosition - vertPosition.xyz);
    }
    `,
    fragmentShaderText: `#version 300 es
    // #extension GL_OES_standard_derivatives : enable
    precision mediump float;
    
    in vec4 vertPositionAfterOffset;
    in vec4 clipSpacePreOffset;
    in vec4 color;
    in vec2 dudvTextureCoordinates;
    in vec3 toCameraVector;
    
    uniform sampler2D refractionTexture;
    uniform sampler2D reflectionTexture;
    uniform sampler2D dudvMap;
    uniform float distortionMoveFactor;
    uniform vec3 directionalLightColor;
    uniform vec3 directionalLightVector;
    uniform bool distortionEnabled;
    uniform float distortionStrength;
    uniform float specularReflectivity;
    uniform float shininessDampening;
    
    out vec4 outputColor;
    void main()
    {
        vec3 viewVector = normalize(toCameraVector);
    
        vec3 U = dFdx(vertPositionAfterOffset.xyz);
        vec3 V = dFdy(vertPositionAfterOffset.xyz);
        vec3 normal = normalize(cross(U,V));
        
        //diffuse
        highp float directional = max(dot(normal.xyz, -directionalLightVector), 0.0);
        vec3 diffuse = (directionalLightColor * directional);
        
        vec2 distortion = vec2(0.0, 0.0);
        if(distortionEnabled) {
            distortion = (texture(dudvMap, vec2(dudvTextureCoordinates.x + distortionMoveFactor, dudvTextureCoordinates.y)).rg * 2.0 - 1.0) * distortionStrength; //converts [0,1] to [-1, 1];
        }
        vec2 normalisedDeviceCoordinates = (clipSpacePreOffset.xy/clipSpacePreOffset.w)/2.0 + 0.5; ///2 + 0.5 to convert from [0, 1] to [-1, 1]
        vec4 refractionTexel = texture(refractionTexture, normalisedDeviceCoordinates+ distortion); // + distortion
        vec4 reflectionTexel = texture(reflectionTexture, vec2(normalisedDeviceCoordinates.x, 1.0-normalisedDeviceCoordinates.y)+ distortion); // + distortion
        
        //fresnel effect    
        //fresnel = [-1, 1] => [view from side, view from top]
        float fresnelFactor = dot(viewVector, vec3(0.0, 1.0, 0.0));
        vec4 texel = mix(reflectionTexel, refractionTexel, fresnelFactor);

        //specular
        vec3 reflectedLightVector = reflect(directionalLightVector, normal);
        float specularFactor = max(dot(reflectedLightVector, viewVector), 0.0);
        specularFactor = pow(specularFactor, shininessDampening);
        vec3 specular = specularFactor * (specularReflectivity - fresnelFactor*0.7) * directionalLightColor;
    
        vec4 waterMixedFrameTextureColor = mix(texel, color, 0.3);
        outputColor = vec4(waterMixedFrameTextureColor.xyz * diffuse + specular, 1.0);
    }
    `,
}

export default WaterShader;