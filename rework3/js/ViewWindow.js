const glm = glMatrix;
const vec2 = glm.vec2;
const vec3 = glm.vec3;
const vec4 = glm.vec4;
const mat4 = glm.mat4;

import Camera from "./util2/Camera.js";
import { TransformControls } from "./util2/TransformControls.js";
import { CameraControls } from "./util2/CameraControls.js";

import * as Interactions from "../../util/interactions.js";

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

        this.camera = new Camera([30,0,0], [0,0,0], [0,1,0]);
        this.editor.current_ray.origin = this.camera.pos;

        // TODO: ideally view_mat and proj_mat are combined, aka proj mat is applied within the camera object
        this.proj_matrix = mat4.create();
        mat4.perspective(
            this.proj_matrix, 
            glm.glMatrix.toRadian(45), 
            (this.width / this.height), 
            0.1, 1000
        );

        this.objects = editor.scene_objects;

        // TODO: remove
        this.show_gizmos = true;
        this.show_AABB = false;

        // ViewWindow controls

        this.dom_element.addEventListener("click", this.mouseClick);


        // transform gizmo controls

        this.transform_controls = new TransformControls(0.8, 10);
        this.transform_controls.connect(this.dom_element);




        // camera controls

        const camera_controls = new CameraControls(this.camera);
        camera_controls.addEventListener("change", () => {
            if (this.transform_controls.display_gizmos) {
                // TODO: repeated code #1
                const obj_center = this.editor.current_selection.aabb.center;
                const obj_center_screen = Interactions.coordsWorldToScreen(
                    obj_center, this.width, this.height, 
                    this.proj_matrix, this.camera.view_matrix
                );
                this.transform_controls.updateGizmos(obj_center_screen, obj_center, vec3.distance(this.camera.pos, obj_center));
            }

            // TODO: might want to improve the way this is handled. Ideally only update when needed (whenever a click occurs)
            // since the ray isn't always needed
            this.editor.current_ray.origin = this.camera.pos;
            this.render();
        });

        camera_controls.connect(this.dom_element);
    }


    mouseClick = (event) => {
        const mouse_x = event.offsetX;
        const mouse_y = event.offsetY;

        const raycast = this.editor.current_ray

        raycast.dir = Interactions.generateRayDir(
            this.width, this.height, 
            mouse_x, mouse_y, 
            this.proj_matrix, this.camera.view_matrix
        );

        let ray_hit = false;
        for (let object of this.objects) {
            if (object.aabb.isIntersecting(raycast)) {
                ray_hit = true;
                if (object === this.editor.current_selection) break;
                this.editor.current_selection = object;


                // TODO: repeated code #1
                this.transform_controls.display_gizmos = true;
                const obj_center = this.editor.current_selection.aabb.center;
                const obj_center_screen = Interactions.coordsWorldToScreen(
                    obj_center, this.width, this.height, 
                    this.proj_matrix, this.camera.view_matrix
                );
                this.transform_controls.updateGizmos(obj_center_screen, obj_center, vec3.distance(this.camera.pos, obj_center));

                break;
            }
        }

        if (!ray_hit) {
            this.editor.current_selection = null;
            this.transform_controls.display_gizmos = false;
        }

        this.render();

        this.dom_element.removeEventListener("mouseup", this.mouseUp);
    }


    render() {
        this.renderer.renderToView(this);
    }
}




// important to note
/* 
From what I can gather it seems that three.js uses signals for things that may update the UI

Whereas the event listeners are for updatings things within the "viewport world"



For example:
within Viewport.js the transformControls have an event listener added
*/
/* transformControls.addEventListener( 'objectChange', function () {

    signals.objectChanged.dispatch( transformControls.object );

} ); */
/* 
which only dispatches a signal since the object to which the gizmos are currently bound, is updated
within TransformControls.js where this happens:
*/
/* function pointerMove() {
    // . . .

    this.dispatchEvent( _changeEvent );
    this.dispatchEvent( _objectChangeEvent );
} */
/* 
Then some weird stuff happens back Viewport.js in regards to the signal that was sent
*/
/* signals.objectChanged.add( function ( object ) {

    if ( editor.selected === object ) {
        box.setFromObject( object, true );
    }

    if ( object.isPerspectiveCamera ) {
        object.updateProjectionMatrix();
    }

    const helper = editor.helpers[ object.id ];

    if ( helper !== undefined && helper.isSkeletonHelper !== true ) {
        helper.update();
    }

    initPT();
    render();
} ); */
/* 
At the end we see that render is called which IMO updates the "UI" of the canvas. Its a bit weird that the
aabb thing for currently selected boxes and the projection matrix are updated here though, since those
aren't technically UI. I dont understand why they couldn't have done these things within the pointerMove
function

I will however, ignore this and stick to my rule: signals = UI, eventListeners = "viewport world" changes
*/