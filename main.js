const glm = glMatrix; // shorten math library name,
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;
import glUtil from "./util/gl_utils.js";
import Entity from "./util/Entity.js";
import { Cube, cube_vertices, cube_indices } from "./util/cube.js";
import graph from "./util/graph.js";
import floor from "./util/floor.js";
import vsSrc from "../shaders/vertexshader.js";
import fsSrc from "../shaders/fragmentshader.js";

const WIDTH = 800;
const HEIGHT = 600;

let view_matrix = null;
let proj_matrix = null;
let current_ray = {};

let global_cam_pos = null;
let cur_selected_entity = null;

let first_entity = null;
let second_entity = null;

let dir_between_two = null;

const entities = new Entity();

// TODOs
/* 
- To show "transmission" between two "routers" simply calculate vector = 
router2's center pos - router1's center pos. And generate lil boxes that 
go between them, just for fun visualization!
- AABB wire frame for debugging (and future feature)
- Improve WASD movement
- Write code for importing actual models (reuse code from ShidE Graphics Engine)
-Customizable AABB so that I don't have to write fixed one...
Would require interactable GIZMOS...
-Design and import a ROUTER model


Learn how to map textures??
Maybe add lighting??
Add direct ray thing (instead of ray stemming from cam)
 */

function main() {
    const canvas = document.getElementById("canvas");

    //
    // Event Listeners
    document.addEventListener("keydown", (e) => {
        if (e.key === "w") {
            vec3.add(CAM_POS, CAM_POS, [0, 0, -0.25]);
        } else if (e.key === "s") {
            vec3.add(CAM_POS, CAM_POS, [0, 0, 0.25]);
        } else if (e.key === "a") {
            vec3.add(CAM_POS, CAM_POS, [-0.25, 0, 0]);
        } else if (e.key === "d") {
            vec3.add(CAM_POS, CAM_POS, [0.25, 0, 0]);
        }
    })
    canvas.addEventListener("click", (e) => {
        if (cur_selected_entity) {
            cur_selected_entity = null;
            return;
        }
        current_ray.dir = generateRayDir(e);
        cur_selected_entity = entities.checkRayIntersection(current_ray);
    });
    canvas.addEventListener("mousemove", (e) => {
        if (!cur_selected_entity) return;
        current_ray.dir = generateRayDir(e);
        const new_pos = calculatePlaneIntersectionPoint(current_ray.dir);
        cur_selected_entity.updatePos([new_pos[0], 0, new_pos[2]]);
    });
    canvas.addEventListener("dblclick", (e) => {
        if (first_entity && second_entity) return;
        current_ray.dir = generateRayDir(e);
        console.log("double clicking");
        if (!first_entity) {
            first_entity = entities.checkRayIntersection(current_ray);
            console.log("first select", first_entity);
            console.log("first pos", first_entity.getPos());
        } else {
            // a first entity is selected
            second_entity = entities.checkRayIntersection(current_ray);
            if (!second_entity) return // didnt select a second entity
            console.log("second select", second_entity);
            console.log("second pos", second_entity.getPos());

            // do some stuff...
            dir_between_two = vec3.normalize([], vec3.subtract([], second_entity.getPos(), first_entity.getPos()));

            entities.addEntity(new Cube(first_entity.getPos(), 0.2, UP_VECTOR, 45, cube_vao));
        }
    });

    //
    // Program Initialization
    const gl = glUtil.getContext(canvas);
    const program = glUtil.createProgram(gl, vsSrc, fsSrc);

    const pos_attrib = gl.getAttribLocation(program, "a_pos");
    const clr_attrib = gl.getAttribLocation(program, "a_clr");

    const model_uniform = gl.getUniformLocation(program, "u_model");
    const view_uniform = gl.getUniformLocation(program, "u_view");
    const proj_uniform = gl.getUniformLocation(program, "u_proj");

    if (pos_attrib < 0 || clr_attrib < 0 || 
        !model_uniform || !view_uniform || !proj_uniform) {
        glUtil.showError(`Failed to get attribs/uniforms:\n`  +
            `pos=${pos_attrib}\ncolor=${clr_attrib}\n` +
            `u_model=${!!model_uniform}\nu_view=${!!view_uniform}\nu_proj=${!!proj_uniform}`);
        return;
    }


    //
    // Buffer Initialization
    const cube_vbo = glUtil.createStaticVertexBuffer(gl, cube_vertices);
    const cube_ebo = glUtil.createStaticIndexBuffer(gl, cube_indices);
    const cube_vao = glUtil.createVertexElementVAO(
        gl, cube_vbo, cube_ebo, pos_attrib, clr_attrib);

    const graph_vbo = glUtil.createStaticVertexBuffer(gl, graph.vertices);
    const graph_vao = glUtil.createVertexVao(
        gl, graph_vbo, pos_attrib, clr_attrib);

    const floor_vbo = glUtil.createStaticVertexBuffer(gl, floor.vertices);
    const floor_ebo = glUtil.createStaticIndexBuffer(gl, floor.indices);
    const floor_vao = glUtil.createVertexElementVAO(
        gl, floor_vbo, floor_ebo, pos_attrib, clr_attrib);


    //
    // Create matrices
    const UP_VECTOR = [0, 1, 0];
    const CAM_POS = [0, 9, 10];
    const CAM_DIR = vec3.subtract([], CAM_POS, [0,0,0]);
    global_cam_pos = CAM_POS;     // global variable
    current_ray.origin = CAM_POS; // global variable
    let model = mat4.create();
    let view = mat4.create();
    let proj = mat4.create();

    // get direction of camera = campos - target
    // normalize
    mat4.perspective(proj, glm.glMatrix.toRadian(45), WIDTH / HEIGHT, 0.1, 1000);

    view_matrix = view; // global variable
    proj_matrix = proj; // global variable

    //
    // Prepare Program
    glUtil.setupRender(gl, canvas, WIDTH, HEIGHT, [0.75, 0.85, 0.8, 1.0]);
    gl.useProgram(program);

    //
    // Create Entities
    entities.addEntity(new Cube([0, 0, 0], 1, UP_VECTOR, 45, cube_vao));
    entities.addEntity(new Cube([2, 0, 0], 1.5, UP_VECTOR, 45, cube_vao));
    entities.addEntity(new Cube([3, 0, 3], 1, UP_VECTOR, 45, cube_vao));
    entities.createEntitiesAABBVao(gl, pos_attrib, clr_attrib);


    //
    // Setup Uniforms
    gl.uniformMatrix4fv(proj_uniform, gl.FALSE, proj);

    let TEMP_current_pos = 0;
    let TEMP_cube_to_move
    const frame = function (should_loop) {

        // update entities, only exists if the second entity was selected
        if (second_entity) {
            TEMP_cube_to_move = entities.getEntity(3);

            TEMP_current_pos += 0.025;
            TEMP_cube_to_move.updatePos(vec3.add([], 
                first_entity.getPos(), vec3.scale([], dir_between_two, TEMP_current_pos)));
            if (vec3.length(vec3.sub([], second_entity.getPos(), first_entity.getPos())) < 
                vec3.length(vec3.sub([], TEMP_cube_to_move.getPos(), first_entity.getPos()))) {
                TEMP_cube_to_move.updatePos(first_entity.getPos());
                /* console.log("SAME POS"); */
                TEMP_current_pos = 0;
            }
            /* console.log(TEMP_cube_to_move.getPos()); */
        }

        mat4.lookAt(view, CAM_POS, vec3.subtract([], CAM_POS, CAM_DIR), UP_VECTOR);
        gl.uniformMatrix4fv(view_uniform, gl.FALSE, view);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(model_uniform, false, model);

        // draw floor
        gl.bindVertexArray(floor_vao);
        gl.drawElements(gl.TRIANGLES, floor.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        // draw axis
        gl.disable(gl.DEPTH_TEST);
        gl.bindVertexArray(graph_vao);
        gl.drawArrays(gl.LINES, 0, graph.vertices.length / 6 - 10); //10 is num of v's used for y axis
        gl.enable(gl.DEPTH_TEST);
        gl.drawArrays(gl.LINES,  graph.vertices.length / 6 - 10, 10);
        gl.bindVertexArray(null);

        // draw entities
        entities.drawEntities(gl, model_uniform);
        entities.drawEntitiesAABB(gl, model_uniform);

        if (should_loop) requestAnimationFrame(frame);
    }

    frame(true);
}

main();


function generateRayDir(e) {
    const rect = canvas.getBoundingClientRect();
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;
    
    const x_ndc = (2 * mouse_x) / WIDTH - 1;
    const y_ndc = 1 - (2 * mouse_y) / HEIGHT;

    const ray_clip = [x_ndc, y_ndc, -1.0, 1.0];

    const ray_eye = vec4.transformMat4([], ray_clip, mat4.invert([], proj_matrix));
    ray_eye[2] = -1,
    ray_eye[3] = 0;

    let ray_world = vec4.transformMat4([], ray_eye, mat4.invert([], view_matrix));
    ray_world = [ray_world[0], ray_world[1], ray_world[2]];
    vec3.normalize(ray_world, ray_world);

    return ray_world;
}

function calculatePlaneIntersectionPoint(dir) {
    // Hard coded values - since we know our plane
    let n = [0, 1, 0];
    let p0 = [0, -0.5, 0]; // aribitrary point ON the plane
    let d = -vec3.dot(n, p0);

    let numerator = vec3.dot(global_cam_pos, n) + d;
    let denominator = vec3.dot(dir, n);
    if (denominator === 0) { // ray missed plane
        console.log("ray missed plane");
        return;
    }
    let t = -(numerator / denominator);
    
    // point on plane given our vector
    let p = vec3.scaleAndAdd([], global_cam_pos, dir, t);

    return p;
}