export const flatVertexShaderText = `#version 300 es
precision mediump float;

in vec3 vertPosition;
in vec3 vertColor;

uniform mat4 mNormal;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

out vec4 fragColor;
out vec4 vertexViewSpace;

void main()
{
    vec3 offset = vec3(0.0, 0.0, 0.0) * 0.2;
    fragColor = vec4(vertColor, 1.0);    
    vertexViewSpace = mView * mWorld * vec4(vertPosition + offset, 1.0);;
    gl_Position = mProj * vertexViewSpace;
}
`;


export const fragmentShaderText = `#version 300 es
// #extension GL_OES_standard_derivatives : enable
precision mediump float;

in vec4 vertexViewSpace;

in vec4 fragColor;
out vec4 outputColor;
void main()
{
    vec3 U = dFdx(vertexViewSpace.xyz);
    vec3 V = dFdy(vertexViewSpace.xyz);
    vec3 normal = normalize(cross(U,V));

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
    // highp vec4 transformedNormal = normalTransformMatrix * vec4(normal, 1.0);
    highp float directional = max(dot(normal.xyz, directionalVector), 0.0);
    vec3 vLighting = (directionalLightColor * directional);
    outputColor = vec4(fragColor.xyz * vLighting, 1.0);
}

`;

export const flatFragmentShaderText = `#version 300 es
// #extension GL_OES_standard_derivatives : enable

attribute vec3 vertexViewSpace;
varying vec4 fragColor;

void main() {
    vec3 U = dFdx(vertexViewSpace);                     
    vec3 V = dFdy(vertexViewSpace);                 
    vec3 normal = normalize(cross(U,V));

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = mNormal * normal;

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

    vLighting = directionalLightColor * directional;
    // fragColor 

}
`;


export const waterVertexShaderText = `#version 300 es
precision mediump float;

in vec3 vertPosition;
in vec3 vertColor;
uniform float time;

uniform mat4 mNormal;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

out vec4 color;
out vec4 vertexViewSpace;
out vec4 clipSpacePreOffset;
out vec2 dudvTextureCoordinates;

const float dudvTiling = 0.2;

void main()
{
    float scale = 500.0;
    vec3 offset = vec3(0.0, sin(time + vertPosition[0]*scale + vertPosition[2]*scale), 0.0) * 0.05;
    color = vec4(vertColor, 1.0);        
    clipSpacePreOffset = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    
    vertexViewSpace = mView * mWorld * vec4(vertPosition + offset, 1.0);;
    gl_Position = mProj * vertexViewSpace;
    dudvTextureCoordinates = vec2(vertPosition.x/2.0 + 0.5, vertPosition.z/2.0 + 0.5) * dudvTiling;
}
`;


export const flatWaterFragmentShaderText = `#version 300 es
// #extension GL_OES_standard_derivatives : enable
precision mediump float;

in vec4 vertexViewSpace;
in vec4 clipSpacePreOffset;
in vec4 color;
in vec2 dudvTextureCoordinates;

uniform sampler2D refractionTexture;
uniform sampler2D dudvMap;
uniform float distortionMoveFactor;

const float distortionStrength = 0.02;

out vec4 outputColor;

void main()
{
    vec3 U = dFdx(vertexViewSpace.xyz);
    vec3 V = dFdy(vertexViewSpace.xyz);
    vec3 normal = normalize(cross(U,V));

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
    // highp vec4 transformedNormal = normalTransformMatrix * vec4(normal, 1.0);
    highp float directional = max(dot(normal.xyz, directionalVector), 0.0);
    vec3 vLighting = (directionalLightColor * directional);
    // outputColor = vec4(fragColor.xyz * vLighting, 1.0);

    vec2 normalisedDeviceSpace = clipSpacePreOffset.xy/clipSpacePreOffset.w;
    vec2 screenSpaceCoords = (normalisedDeviceSpace/2.0) + 0.5;
    vec2 distortion = (texture(dudvMap, vec2(dudvTextureCoordinates.x + distortionMoveFactor, dudvTextureCoordinates.y)).rg * 2.0 - 1.0) * distortionStrength; //converts [0,1] to [-1, 1];

    vec4 texel = texture(refractionTexture, screenSpaceCoords);
    vec4 waterMixedFrameTextureColor = mix(texel, color, 0.5) * 1.2;
    outputColor = vec4(waterMixedFrameTextureColor.xyz * vLighting, 1.0);
}
`;


    
    // highp vec3 directionalLightColor = vec3(1, 1, 1);
    // highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    // highp vec4 transformedNormal = mNormal * vec4(vertNormal, 1.0);

    // highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

    // vLighting = directionalLightColor * directional;