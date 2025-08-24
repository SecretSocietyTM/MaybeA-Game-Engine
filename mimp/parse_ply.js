/**
 * Takes a stringified ply file and returns a mesh 
 * for insertion into a scene.
 *
 * @param {string} ply
 * @returns {object} mesh to be inserted into a scene
 */
export function parsePLY(ply) {
    // start by breaking string up by presence of new line
    const buf = ply.split("\n");

    let mesh = {
        vertices: [],
        vertex_colors: [],
        indices: []
    };

    // dont actually do anything with these...
    let vertex_count;
    let face_count;

    // start by reading header
    let i = 0;
    let cur = buf[i];
    let color_index = -1;
    let begin_color_index = false;
    while (cur !== "end_header") {
        if (begin_color_index) {
            color_index++;
        }
        i++;
        cur = buf[i];
        if (cur.includes("element vertex")) {
            begin_color_index = true;
            vertex_count = cur.split(" ")[2];
        }
        
        if (cur.includes("element face")) {
            face_count = cur.split(" ")[2];
        }
        if (cur.includes("red")) {
            begin_color_index = false;
        }
    }

    // parse up the faces definition (length of 4)
    i++;
    cur = buf[i];
    while (cur.split(" ").length !== 4) {
        let vertex_info = cur.split(" ");
        mesh.vertices.push(
            vertex_info[0],
            vertex_info[1],
            vertex_info[2]
        );
        // TODO: IMPLEMENT SOMETHINIG BETTER
        if (vertex_info[color_index + 0] > 1 || 
            vertex_info[color_index + 1] > 1 ||
            vertex_info[color_index + 2] > 1) {
                vertex_info[color_index + 0] = vertex_info[color_index + 0] / 255;
                vertex_info[color_index + 1] = vertex_info[color_index + 1] / 255;
                vertex_info[color_index + 2] = vertex_info[color_index + 2] / 255;
            }
        mesh.vertex_colors.push(
            vertex_info[color_index + 0],
            vertex_info[color_index + 1],
            vertex_info[color_index + 2]
        );
        i++;
        cur = buf[i];
    }

    while (cur !== "") {
        let face_info = cur.split(" ");
        mesh.indices.push(
            face_info[1],
            face_info[2],
            face_info[3]
        );
        i++;
        cur = buf[i];
    }

    console.log(mesh);
    return mesh;
}

// TODO: clean this up, put it somewhere else, or get rid of it, TEMP
export function buildPosClrInterleavedArr(pos, clr) {
    const result = [];
    for (let i = 0; i < pos.length; i+=3) {
        result.push(pos[i], pos[i+1], pos[i+2], 
                    clr[i], clr[i+1], clr[i+2]);
    }
    console.log(result);
    return result;
}