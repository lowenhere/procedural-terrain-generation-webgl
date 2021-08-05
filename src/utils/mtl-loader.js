/**
 * Loads a .mtl file. NOTE: currently only supports diffuse color
 * @param {String} mtlString raw .mtl string
 * @returns {Array<{
 *      name:   String,
 *      Kd:     Array<Number>
 * }>}
 */
const loadMtlString = (mtlString) => {
    const materials = [];

    let material = undefined;

    const newMtlRegex = /newmtl\s+(.+)/gi;
    const kdRegex = /Kd\s+(-?\d*.?\d*)\s+(-?\d*.?\d*)\s+(-?\d*.?\d*)/gi;

    const lines = mtlString.split("\n");

    lines.forEach((line) => {
        if (newMtlRegex.test(line)){
            newMtlRegex.lastIndex = 0;

            const name = [...line.matchAll(newMtlRegex)][0][1];
            material = { name };

            materials.push(material);
            return
        }

        if (kdRegex.test(line)){
            kdRegex.lastIndex = 0;

            const kdStr = [...line.matchAll(kdRegex)][0].slice(1);
            const kd = kdStr.map(i => Number(i));

            material["Kd"] = kd;
            return
        }
    });

    return materials
}

export default loadMtlString;
