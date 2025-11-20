import Camera from "./util/Camera.js";
import { Raycaster } from "./util/Raycaster.js";
import { TransformControls } from "./util/TransformControls.js";
import { CameraControls } from "./util/CameraControls.js";

// global variables
const raycaster = new Raycaster();

export class ViewWindow {
    constructor(editor, dom_element, width = 800, height = 600) {
        this.editor = editor;
        this.dom_element = dom_element;
        this.renderer = editor.renderer;
        this.canvas = editor.canvas;
        
        // TODO: (1) uncomment, old way of doing things
        /* this.dom_element.style.width = `${width}px`;
        this.dom_element.style.height = `${height}px`;
        const rect = this.dom_element.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = this.canvas.clientHeight - rect.bottom;
        this.width = width;
        this.height = height; */

        // TODO: implement new method
        // this method assumes the div already has a size assigned
        const rect = this.dom_element.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = this.canvas.clientHeight - rect.bottom;
        this.width = rect.width;
        this.height = rect.height;

        this.camera = new Camera([30,0,0], [0,0,0], [0,1,0], 45, (this.width / this.height), 0.1, 1000);

        this.objects = editor.scene_objects;

        this.show_gizmos = true;
        this.show_AABB = false;

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
            this.render();
        });
        camera_controls.connect(this.dom_element);

        // 
        // view controls
        this.dom_element.addEventListener("click", this.mouseClick);
        // TODO: remove
        document.addEventListener("keydown", (e) => {
            if (e.key === "t") {
                this.transform_controls.setMode("translate");
            } else if (e.key === "r") {
                this.transform_controls.setMode("rotate");
            } else if (e.key === "s") {
                this.transform_controls.setMode("scale");
            } else if (e.key === "1") {
                this.show_AABB = !this.show_AABB;
            } else if (e.key === "2") {
                // Nothing yet
            }

            this.render();
        });
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

        // TODO: Priority (LOW) clicking on the same thing should not cause a rerender
        if (object === null) this.transform_controls.detachObject();
        else this.transform_controls.attachObject(object);

        this.render();
    }

    render() {

        const start_time = performance.now();

        this.renderer.setViewport(this.left, this.bottom, this.width, this.height);
        this.renderer.render3D(this.objects, this.camera, this.show_AABB);

        if (this.transform_controls.display_gizmos) {
            this.renderer.render3D(this.transform_controls.active_gizmos, this.camera, false);
            this.renderer.renderUI(this.transform_controls.main_gizmo, [this.left, this.bottom]);
        }

        const end_time = performance.now();
        /* console.log("render time", end_time - start_time); */
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