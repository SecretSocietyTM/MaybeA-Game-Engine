export class ObjectInspector {
    constructor(editor) {
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
            color: document.getElementById("obj_color"),
            use_color: document.getElementById("obj_use-color"),
            is_visible: document.getElementById("obj_is-visible"),
            show_AABB: document.getElementById("obj_show-AABB"),
        }

        editor.signals.objectSelected.addListener(object => {
            this.updateUI(object);
        })
    }

    updateUI(object) {
        if (!object) {
            this.ui.container.style.display = "none";
            return;
        };

        this.ui.container.style.display = "block";

        // set name
        this.ui.name.value = object.name;

        // TODO: for pos / scale want to show 2 decimal values
        // set position
        this.ui.position.x.value = object.pos[0].toFixed(2);
        this.ui.position.y.value = object.pos[1].toFixed(2);
        this.ui.position.z.value = object.pos[2].toFixed(2);

        // set rotation
        this.ui.rotation.x.value = object.rotation_angles[0].toFixed(1);
        this.ui.rotation.y.value = object.rotation_angles[1].toFixed(1);
        this.ui.rotation.z.value = object.rotation_angles[2].toFixed(1);

        // set scale
        this.ui.scale.x.value = object.scale[0].toFixed(2);
        this.ui.scale.y.value = object.scale[1].toFixed(2);
        this.ui.scale.z.value = object.scale[2].toFixed(2);

        // set color
        // TODO: need a function to convert from 0.0 - 1.0 to 0 - 255
        // this.ui.color // . . . .

        // set checkboxes
        this.ui.use_color.checked = object.use_color;
        this.ui.is_visible.checked = object.visible;
        this.ui.show_AABB.checked = object.show_AABB;
    }
}