// TODO: try to remember what MIMP stands for... something import. Mini Import? 
// Model Import???
// Inspired by tinyply


export class PlyFile {
    constructor() {
        this.elements = {};
        this.current_element = null;
        this.lines = [];
    }

    // TODO: add a way to get the alpha value of the vertex colors.
    parsePLY(ply) {

        this.clear();

        ply = ply.replace(/\r/g, "");
        this.lines = ply.split("\n");
        
        let mesh = {};

        this.parsePLYHeader();

        const positions = this.getVertexProperties(["x", "y", "z"]);
        mesh.vertices = positions;
        
        const colors = this.getVertexProperties(["red", "green", "blue"]);
        mesh.vertex_colors = colors;

        const normals = this.getVertexProperties(["nx", "ny", "nz"]);
        mesh.normals = normals;

        const uv_coords = this.getVertexProperties(["s", "t"]);
        mesh.uv_coords = uv_coords;

        const faces = this.getFaceProperties();
        mesh.indices = faces;

        return mesh;
    }

    clear() {
        this.elements = {};
        this.current_element = null;
        this.lines = [];
    }

    // Requires split ply file 
    parsePLYHeader() {

        let line;
        let success = true;

        let i = 0;

        while (true) {
            line = this.lines[i];
            i++;

            if (line === "") continue;

            const _line = line.trim().split(" ");
            const token = _line[0];

            if (token === "ply" || 
                token === "PLY" || 
                token === "comment" ||
                token === "format"  || 
                token === "obj_info") continue;
            else if (token === "element") this.readHeaderElement(_line);
            else if (token === "property") this.readHeaderProperty(_line);
            else if (token === "end_header") break;
            else success = false;
        }

        this.elements.vertex.start_idx = i;
        this.elements.face.start_idx = i + this.elements.vertex.length;

        return success;
    }

    readHeaderElement(line) {
        const type = line[1];
        const length = +line[2];

        const element = {
            length: length,
            properties: []
        };

        this.current_element = type;
        this.elements[type] = element;
    }

    readHeaderProperty(line) {
        const property = line[line.length - 1];

        if (this.current_element === null) throw new Error("No elements. Bad file");
        this.elements[this.current_element].properties.push(property);
    }

    getVertexProperties(properties) {
        if (!this.elements.hasOwnProperty("vertex")) {
            throw new Error("vertex element does not exist");
        }

        const vertex = this.elements.vertex;
        const props = vertex.properties;

        const props_exists = this.checkPropertiesExist(props, properties);
        if (props_exists === false) return null;

        const count = vertex.length;
        const start = vertex.start_idx;

        let out_data = [];

        for (let i = start; i < start + count; i++) {
            const line_data = this.lines[i].split(" ");
            for (const key of properties) {
                const prop_idx = props.indexOf(key);
                let  prop_data = line_data[prop_idx];
                if (key === "red" || key === "green" || key === "blue") prop_data /= 255
                out_data.push(+prop_data);
            }
        }

        return out_data;
    }

    getFaceProperties() {
        if (!this.elements.hasOwnProperty("face")) {
            throw new Error("face element does not exist");
        }

        const face = this.elements.face;
        const count = face.length;
        const start = face.start_idx;

        let out_data = [];

        for (let i = start; i < start + count; i++) {
            const data = this.lines[i].split(" ");
            // assumes triangles, no quads.
            out_data.push(+data[1], +data[2], +data[3]);
        }

        return out_data;
    }

    checkPropertiesExist(all_properties, desired_properties) {
        // using a counter is a bit hacky but I'm not sure how else to do this.
        let missing_count = 0;

        for (const prop of desired_properties) {
            if (!all_properties.includes(prop)) {
                missing_count++;
            }
        }

        // none of the properties exist
        if (missing_count !== desired_properties.length) {
            return true
        }

        return false
    }
}