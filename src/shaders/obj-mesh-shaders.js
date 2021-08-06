export const basicVertexShaderText = 
`# version 300 es
precision highp float;

in vec3 vertPosition;
in vec3 vertNormal;
in vec4 vertColor;

uniform mat4 mModel;
uniform mat4 mView;
uniform mat4 mProj;

out vec3 faceNormal;
out vec3 fragPos;
out vec4 fragColor;
out vec4 vertexViewSpace;

void main(){
    faceNormal = vertNormal;
    fragPos = vec3(mModel * vec4(vertPosition, 1.0));
    fragColor = vertColor;
    vertexViewSpace = mView * mModel * vec4(vertPosition, 1.0);

    gl_Position = mProj * vertexViewSpace;
}
`;

export const basicFragmentShaderText = 
`# version 300 es
precision highp float;

in vec3 faceNormal;
in vec3 fragPos;
in vec4 fragColor;
in vec4 vertexViewSpace;

out vec4 outputColor;

void main(){
    // ambient
    float ambientStrength = 4.0;
    vec3 lightColor = vec3(1.0, 1.0, 1.0);
    vec3 ambient = ambientStrength * lightColor;

    // diffuse
    float diffuseStrength = 3.0;
    vec3 lightPos = vec3(1.0,1.0,10.0);
    vec3 norm = normalize(faceNormal);
    vec3 lightDir = normalize(lightPos - fragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diffuseStrength * diff * lightColor;

    outputColor = vec4(ambient + diffuse, 1.0) * fragColor;
}
`;
