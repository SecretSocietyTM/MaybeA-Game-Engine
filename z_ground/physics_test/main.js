import Renderer from "../../rework3/js/util/Renderer.js";
import Camera from "../../rework3/js/util/Camera.js";
import SceneObject from "../../rework3/js/util/SceneObjects.js"
import MeshesObj from "../../models/meshes_index.js";

const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// TODO: need to introduce a better system for assigning a viewport that isn't dependant on the "EDITOR"
const view = document.getElementById("view");
view.style.width = `${canvas.width}px`;
view.style.height = `${canvas.height}px`;
const rect = view.getBoundingClientRect();
const view_obj = {
    view: view,
    rect: rect,
    left: rect.left,
    bottom: canvas.clientHeight - rect.bottom,
    width: rect.width,
    height: rect.height,
}
view_obj.camera = new Camera(45, (view_obj.width / view_obj.height), 0.1, 1000);

import { CameraControls } from "../../rework3/js/util/CameraControls.js";
const camera_controls = new CameraControls(view_obj.camera);
camera_controls.connect(view_obj.view);

const renderer = new Renderer(canvas);
renderer.addAABBMesh(MeshesObj.aabb_wireframe);


const objects = [];
const player = new SceneObject("player", {name: "unit_cube", data: MeshesObj.unit_cube}, [0, 100, 0]);
player.velocity = {x: 0, y: 0, z: 0};

objects.push(player);





let frame_id;
let enable_loop = false;
let prev_time;

function draw() {
    // TODO: setting the viewport each frame is a bit odd
    renderer.setViewport(view_obj.left, view_obj.bottom, view_obj.width, view_obj.height);

    const cur_time = performance.now();
    let dt = (cur_time - prev_time) / 1000;
    dt = Math.min(dt, 0.05); // capped at 50ms: prevents weird behavior if tab stalls due to debugging
    console.log("delta time", dt);
    prev_time = cur_time;

    /* game loop stuff goes here */
    updatePhysics(objects, dt);

    /* render */
    renderer.render3D(objects, view_obj.camera, false);

    /* call next frame */
    frame_id = requestAnimationFrame(draw);
}


const GRAVITY = -9.8; // acceleration = m/s^2
function updatePhysics(objects, dt) {
    objects.forEach(object => updateObjectPhysics(object, dt));
}

/* Just applying gravity to an object for now */
function updateObjectPhysics(object, dt) {
    /* Object should have some velocity, in this case <0,0,0> */
    if (object.position[1] > 0) {
        object.velocity.y += GRAVITY * dt;
        let pos_y = object.position[1] + object.velocity.y * dt;
        object.updatePosition([object.position[0], pos_y, object.position[2]]);
    }
}



/* Event Listeners */
document.addEventListener("keydown", e => {
    if (e.key === "q") {

        enable_loop = !enable_loop;

        if (!enable_loop) {
            cancelAnimationFrame(frame_id);
            return;
        }

        // begin the loop
        prev_time = performance.now();
        frame_id = requestAnimationFrame(draw);
    }
});


