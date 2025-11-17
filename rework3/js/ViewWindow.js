const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./util2/Camera.js";
import { Raycaster } from "./util2/Raycaster.js";
import { TransformControls } from "./util2/TransformControls.js";
import { CameraControls } from "./util2/CameraControls.js";

import * as Interactions from "../../util/interactions.js";

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

        // ViewWindow controls

        this.dom_element.addEventListener("click", this.mouseClick);


        // transform gizmo controls

        this.transform_controls = new TransformControls(this.camera);
        this.transform_controls.addEventListener("change", () => {
            
            // want to see hover highlight
            this.render();
        })
        this.transform_controls.connect(this.dom_element);

        // camera controls

        const camera_controls = new CameraControls(this.camera);
        camera_controls.addEventListener("change", () => {

            // TODO: still don't want to do this here
            this.transform_controls.cameraMoved(this.camera);

            this.render();
        });

        camera_controls.connect(this.dom_element);
    }

    // TODO: Below code is nice but still need to resolve updating transform gizmos
    // for each call to render. This will also solve some problems with
    // objects but might be complicated....
    mouseClick = (event) => {

        if (this.transform_controls.is_interacting) {
            this.transform_controls.is_interacting = false;
            this.editor.current_selection.setLastStaticTransform();
            return;
        }

        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        const mouse_x_ndc = (2 * mouse_x) / this.width - 1;
        const mouse_y_ndc = 1 - (2 * mouse_y) / this.height;
        const point_ndc = {x: mouse_x_ndc, y: mouse_y_ndc};

        const intersections = raycaster.getIntersections(point_ndc, this.camera, this.objects);

        const object = this.select(this.editor.selected_object, intersections);
        this.editor.current_selection = object;

        // TODO: need to update gizmos when an object is attached
        if (object === null) this.transform_controls.detachObject();
        else this.transform_controls.attachObject(object);


        this.render();
    }

    // just a helper function
    select(selected_object, objects) {

        if (objects.length > 0) {
            const object = objects[0];

            if (selected_object === object) return;
            return object;
        } 

        return null;
    }


    render() {
        this.renderer.renderToView(this);
    }
}