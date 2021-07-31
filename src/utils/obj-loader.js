/**
 * Loads an .obj file. Only loads vertices, vertexNormals and faces.
 * @param {String} objString raw .obj file string
 * @returns {{ 
 *      vertices:       Array<Array<Number>>,
 *      vertexNormals:  Array<Array<Number>>,
 *      faces:          Array<Array<Number>>,
 * }}
 */
const loadObjString = (objString) => {
    const object = {
        vertices: [],
        vertexNormals: [],
        faces: [],
    }

    const vRegex = /v[ \t](-?\d*.?\d*)[ \t](-?\d*.?\d*)[ \t](-?\d*.?\d*)/g;
    const vnRegex = /vn[ \t](-?\d*.?\d*)[ \t](-?\d*.?\d*)[ \t](-?\d*.?\d*)/g;
    const fRegex = /f[ \t](\d*)\/(\d*)\/(\d*)[ \t](\d*)\/(\d*)\/(\d*)[ \t](\d*)\/(\d*)\/(\d*)/g;

    const lines = objString.split("\n");

    // temporary array to store the vertex normals since they don't come in order
    const vertexNormalMapping = [];

    lines.forEach((line) => {
        // vertex line
        if (vRegex.test(line)) {
            vRegex.lastIndex = 0; // clear lastIndex else the next test won't work
            // the first result from matchAll is the full line, so we ignore it
            const vertexStr = [...line.matchAll(vRegex)][0].slice(1);
            const vertex = vertexStr.map(i => Number(i));

            object.vertices.push(vertex);
            return
        }

        // vertexNormal line
        if (vnRegex.test(line)) {
            vnRegex.lastIndex = 0; // clear lastIndex else the next test won't work
            // the first result from matchAll is the full line, so we ignore it
            const vertexNormalStr = [...line.matchAll(vnRegex)][0].slice(1);
            const vertexNormal = vertexNormalStr.map(i => Number(i));

            // vertex normals don't come in order
            vertexNormalMapping.push(vertexNormal);

            // push in a null value as a placeholder
            object.vertexNormals.push(null);
            return
        }

        // face line
        // we are assuming here that the face lines come after all the vertex / vertexNormal lines
        if (fRegex.test(line)) {
            fRegex.lastIndex = 0; // clear lastIndex else the next test won't work
            const faceStr = [...line.matchAll(fRegex)][0].slice(1);
            const face = faceStr.map(i => Number(i)); // should be fine since Number("") = 0

            // set vertexNormals
            object.vertexNormals[face[0]-1] = vertexNormalMapping[face[2]-1];
            object.vertexNormals[face[3]-1] = vertexNormalMapping[face[5]-1];
            object.vertexNormals[face[6]-1] = vertexNormalMapping[face[8]-1];

            // set faces
            const faceVertices = [face[0]-1, face[3]-1, face[6]-1];
            object.faces.push(faceVertices);
            return
        }
    });

    return object
};

export default loadObjString