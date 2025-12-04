export class ObjectInspector {
    constructor(editor) {

        this.editor = editor;
        this.signals = editor.signals;
        this.object = null;

        this.ui = {
            container: document.getElementById("object_inspector"),

            name: document.getElementById("obj_name"),
            position: {
                x: document.getElementById("obj_position_x"),
                y: document.getElementById("obj_position_y"),
                z: document.getElementById("obj_position_z"),
            },
            rotation: {
                x: document.getElementById("obj_rotation_x"),
                y: document.getElementById("obj_rotation_y"),
                z: document.getElementById("obj_rotation_z"),                
            },
            scale: {
                x: document.getElementById("obj_scale_x"),
                y: document.getElementById("obj_scale_y"),
                z: document.getElementById("obj_scale_z"),      
            },
            use_texture: document.getElementById("obj_use-texture"),
            texture: document.getElementById("obj_texture"),
            use_color: document.getElementById("obj_use-color"),
            color: document.getElementById("obj_color"),
            is_visible: document.getElementById("obj_is-visible"),
            show_AABB: document.getElementById("obj_show-AABB"),
        };

        this.signals.objectSelected.addListener(object => {
            this.object = object;

            this.updateUI(object);
        });

        this.signals.objectChanged.addListener(() => {
            this.updateUI(this.object);
        });

        this.connect();
    }

    // TODO: need some QOL changes for input changes
    // Pressing enter should unfocus
    // Clicking should highlight the whole value
    connect() {
        const scope = this;

        scope.ui.name.addEventListener("change", e => {
            scope.object.name = e.target.value

            scope.signals.objectChanged.dispatch(scope.object);
        });

        const ui_position = scope.ui.position;
        for (const key in ui_position) {
            ui_position[key].addEventListener("change", e => {
                const new_position = [
                    +ui_position.x.value,
                    +ui_position.y.value,
                    +ui_position.z.value
                ];
                const new_val = +ui_position[key].value;
                ui_position[key].value = new_val.toFixed(2);

                scope.object.updatePosition(new_position);
                // TODO: this should not function like this... 
                scope.object.setLastStaticTransform();

                scope.signals.objectChanged.dispatch(scope.object);
            });
        }

        const ui_rotation = scope.ui.rotation;
        for (const key in ui_rotation) {
            ui_rotation[key].addEventListener("change", e => {
                const new_rotation = [
                    +ui_rotation.x.value,
                    +ui_rotation.y.value,
                    +ui_rotation.z.value
                ];
                const new_val = +ui_rotation[key].value;
                ui_rotation[key].value = new_val.toFixed(1);

                scope.object.updateRotation(new_rotation);
                // TODO: this should not function like this... 
                scope.object.setLastStaticTransform();

                scope.signals.objectChanged.dispatch(scope.object);
            });
        }

        const ui_scale = scope.ui.scale;
        for (const key in ui_scale) {
            ui_scale[key].addEventListener("change", e => {
                const new_scale = [
                    +ui_scale.x.value,
                    +ui_scale.y.value,
                    +ui_scale.z.value
                ];
                const new_val = +ui_scale[key].value;
                ui_scale[key].value = new_val.toFixed(1);

                scope.object.updateScale(new_scale);
                // TODO: this should not function like this... 
                scope.object.setLastStaticTransform();

                scope.signals.objectChanged.dispatch(scope.object);
            });
        }

        scope.ui.color.addEventListener("input", e => {

            let clr = hexToRGB(e.target.value);
            clr = rgbToFloat(clr);

            scope.object.color = [clr.r, clr.g, clr.b];

            scope.signals.objectChanged.dispatch(scope.object);
        });

        scope.ui.use_texture.addEventListener("change", e => {
            scope.object.use_texture = e.target.checked;

            scope.signals.objectChanged.dispatch(scope.object);
        });

        scope.ui.use_color.addEventListener("change", e => {
            scope.object.use_color = e.target.checked;

            scope.signals.objectChanged.dispatch(scope.object);
        });
        
        scope.ui.color.addEventListener("change", e => {

            let clr = hexToRGB(e.target.value);
            clr = rgbToFloat(clr);

            scope.object.color = [clr.r, clr.g, clr.b];

            scope.signals.objectChanged.dispatch(scope.object);
        });

        scope.ui.is_visible.addEventListener("change", e => {
            scope.object.visible = e.target.checked;

            scope.signals.objectChanged.dispatch(scope.object);
        });

        scope.ui.show_AABB.addEventListener("change", e => {
            scope.object.show_AABB = e.target.checked;

            scope.signals.objectChanged.dispatch(scope.object)

        });
    }


    updateUI(object) {
        if (!object) {
            this.ui.container.style.display = "none";
            return;
        };

        this.ui.container.style.display = "block";

        // set name
        this.ui.name.value = object.name;

        // set position
        this.ui.position.x.value = object.position[0].toFixed(2);
        this.ui.position.y.value = object.position[1].toFixed(2);
        this.ui.position.z.value = object.position[2].toFixed(2);

        // set rotation
        this.ui.rotation.x.value = object.rotation[0].toFixed(1);
        this.ui.rotation.y.value = object.rotation[1].toFixed(1);
        this.ui.rotation.z.value = object.rotation[2].toFixed(1);

        // set scale
        this.ui.scale.x.value = object.scale[0].toFixed(2);
        this.ui.scale.y.value = object.scale[1].toFixed(2);
        this.ui.scale.z.value = object.scale[2].toFixed(2);

        // set texture
        let tex_name = object.texture === null ? "None" : object.texture.name;
        this.ui.texture.textContent = tex_name; 

        // set color
        let clr = object.color;
        clr = {r: clr[0], g: clr[1], b: clr[2]};
        clr = rgbFromFloat(clr);
        this.ui.color.value = rgbToHex(clr);

        // set checkboxes
        this.ui.use_color.checked = object.use_color;
        this.ui.is_visible.checked = object.visible;
        this.ui.show_AABB.checked = object.show_AABB;
    }
}


function rgbToFloat({r, g, b}) {
    return {
        r: r / 255,
        g: g / 255,
        b: b / 255
    };
}

function rgbFromFloat({r, g, b}) {
    return {
        r: r * 255,
        g: g * 255,
        b: b * 255
    };
}

function hexToRGB(hex) {
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);

    return {r,g,b};
}

// TODO: issues with certain colors
// Courtesy of ChatGPT...
function rgbToHex({r, g, b}) {
    return (
        "#" +
        [r, g, b].map(v => Math.max(0, Math.min(255, v))) // clamp
                 .map(v => v.toString(16).padStart(2, "0"))
                 .join("")
    );
}