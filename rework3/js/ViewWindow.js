const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./util2/Camera.js";
import { Raycaster } from "./util2/Raycaster.js";
import { TransformControls } from "./util2/TransformControls.js";
import { CameraControls } from "./util2/CameraControls.js";

// global variables
const raycaster = new Raycaster();

export class ViewWindow {
    constructor(editor, dom_element, width = 800, height = 600) {
        this.editor = editor;
        this.dom_element = dom_element;
        this.renderer = editor.renderer;
        this.canvas = editor.canvas;
        
        this.dom_element.style.width = `${width}px`;
        this.dom_element.style.height = `${height}px`;

        const rect = this.dom_element.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = this.canvas.clientHeight - rect.bottom;
        this.width = width;
        this.height = height;

        this.camera = new Camera([30,0,0], [0,0,0], [0,1,0], 45, (this.width / this.height), 0.1, 1000);
        this.editor.current_ray.origin = this.camera.pos;

        this.objects = editor.scene_objects;

        this.show_gizmos = true;
        this.show_AABB = false;

        // 
        // view controls
        this.dom_element.addEventListener("click", this.mouseClick);

        // 
        // transform controls
        this.transform_controls = new TransformControls(this.camera);
        this.transform_controls.addEventListener("change", () => {
            this.render();
        })
        this.transform_controls.connect(this.dom_element);

        // 
        // camera controls
        const camera_controls = new CameraControls(this.camera);
        camera_controls.addEventListener("change", () => {

            // TODO: still don't want to do this here
            this.transform_controls.cameraMoved(this.camera);

            this.render();
        });
        camera_controls.connect(this.dom_element);
    }

    mouseClick = (event) => {

        // prevents clicking off of object while using transform handles
        if (this.transform_controls.is_interacting) {
            this.transform_controls.is_interacting = false;
            this.editor.current_selection.setLastStaticTransform();
            return;
        }

        const point_ndc = getMousePositionNDC(this.dom_element, event.offsetX, event.offsetY);

        raycaster.setFromCamera(point_ndc, this.camera);
        const intersections = raycaster.getIntersections(this.objects);

        const object = select(this.editor.selected_object, intersections);
        this.editor.current_selection = object;

        if (object === null) this.transform_controls.detachObject();
        else this.transform_controls.attachObject(object);

        this.render();
    }

    render() {
        this.renderer.renderToView(this);
    }
}


// helper functions

function getMousePositionNDC(dom_element, x, y) {
    const rect = dom_element.getBoundingClientRect();
    const x_ndc = (2 * x) / rect.width - 1;
    const y_ndc = 1 - (2 * y) / rect.height;

    return {x: x_ndc, y: y_ndc};
}


function select(selected_object, objects) {

    if (objects.length > 0) {
        const object = objects[0];

        if (selected_object === object) return;
        return object;
    } 

    return null;
}