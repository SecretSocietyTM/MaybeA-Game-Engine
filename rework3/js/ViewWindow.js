import Camera from "./util/Camera.js";
import { Raycaster } from "./util/Raycaster.js";
import { TransformControls } from "./util/TransformControls.js";
import { CameraControls } from "./util/CameraControls.js";

// global variables
const raycaster = new Raycaster();

export class ViewWindow {

    constructor(editor, dom_element) {
        this.editor = editor;
        this.signals = editor.signals;

        this.dom_element = dom_element;
        this.renderer = editor.renderer;
        this.canvas = editor.canvas;
        
        const rect = this.dom_element.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = this.canvas.clientHeight - rect.bottom;
        this.width = rect.width;
        this.height = rect.height;

        this.camera = new Camera(45, (this.width / this.height), 0.1, 1000);

        this.objects_map = editor.object_map; // (key: id, value: object)
        this.objects_array = []; // an array is needed for certain things

        this.show_gizmos = true;
        this.show_AABB = false;

        // 
        // transform controls
        this.transform_controls = new TransformControls(this.camera);
        this.transform_controls.addEventListener("objectChange", () => {

            this.signals.objectChanged.dispatch(this.editor.cur_selection);

            this.render();
        });
        this.transform_controls.addEventListener("axisChange", () => {
            this.render();
        });
        this.transform_controls.connect(this.dom_element);

        // 
        // camera controls
        this.camera_controls = new CameraControls(this.camera);
        this.camera_controls.addEventListener("change", () => {
            this.render();
        });
        this.camera_controls.connect(this.dom_element);

        // 
        // view controls
        this.dom_element.addEventListener("click", this.mouseClick);
        this.dom_element.addEventListener("dblclick", this.doubleClick);
        // TODO: this should be in Editor.js somehow
        document.addEventListener("keydown", (e) => {
            if (e.key === "t") {
                this.transform_controls.setMode("translate");
            } else if (e.key === "r") {
                this.transform_controls.setMode("rotate");
            } else if (e.key === "s") {
                this.transform_controls.setMode("scale");
            } else if (e.key === "+") {
                this.show_AABB = !this.show_AABB;
            } else if (e.ctrlKey && e.key === "c") {
                if (this.editor.cur_selection !== null) {
                    this.editor.copied_object = this.editor.cur_selection;
                }
            } else if (e.ctrlKey && e.key === "v") {
                if (this.editor.copied_object !== null) {
                    this.editor.copyObject(this.editor.copied_object);
                }
            } else if (e.key === "Delete") {
                if (this.editor.cur_selection !== null) {
                    this.editor.removeObject(this.editor.cur_selection);
                }
            }

            this.render();

        });


        //
        // signals

        this.signals.sceneGraphChanged.addListener(object => {
            this.objects_array = [...this.objects_map.values()];

            this.render();
        });

        this.signals.objectChanged.addListener( () => {
            this.render();
        });

        this.signals.objectSelected.addListener(object => {
            
            this.transform_controls.detachObject();

            const previous_selected = this.editor.prev_selection;

            if (previous_selected) {
                previous_selected.show_AABB = false;
            }

            if (object !== null) {

                object.show_AABB = true;

                this.transform_controls.attachObject(object);
            }

            this.render();
        });

        this.signals.objectFocused.addListener(object => {
            this.camera_controls.focus(object);
        });
    }

    mouseClick = (event) => {

        // prevents clicking off of object while using transform handles
        if (this.transform_controls.is_interacting) {
            this.transform_controls.is_interacting = false;
            this.editor.cur_selection.setLastStaticTransform();
            return;
        }

        const point_ndc = getMousePositionNDC(this.dom_element, event.offsetX, event.offsetY);

        raycaster.setFromCamera(point_ndc, this.camera);
        const intersections = raycaster.getIntersections(this.objects_array);

        if (intersections.length > 0) {
            const object = intersections[0];
            this.editor.select(object);
        } else {
            this.editor.select(null);
        }

    }

    doubleClick = (event) => {
        const point_ndc = getMousePositionNDC(this.dom_element, event.offsetX, event.offsetY);

        raycaster.setFromCamera(point_ndc, this.camera);
        const intersections = raycaster.getIntersections(this.objects_array);

        if (intersections.length > 0) {
            const object = intersections[0];
            this.editor.focus(object);
        }
    }


    render() {

        const start_time = performance.now();

        this.renderer.setViewport(this.left, this.bottom, this.width, this.height);
        this.renderer.render3D(this.objects_array, this.camera, this.show_AABB);

        if (this.transform_controls.display_gizmos) {
            this.renderer.render3D(this.transform_controls.active_gizmos, this.camera, false);
            this.renderer.renderUI(this.transform_controls.main_gizmo, [this.left, this.bottom]);
        }

        const end_time = performance.now();
        console.log("render time", end_time - start_time);
    }

    #render_count = 0;
}


// helper functions

function getMousePositionNDC(dom_element, x, y) {
    const rect = dom_element.getBoundingClientRect();
    const x_ndc = (2 * x) / rect.width - 1;
    const y_ndc = 1 - (2 * y) / rect.height;

    return {x: x_ndc, y: y_ndc};
}