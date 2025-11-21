import { parsePLY } from "../mimp/parse_ply.js";

export class MenuBar {
    constructor(editor) {
        
        this.editor = editor;
        this.signals = editor.signals;

        this.ui = {
            container: document.getElementById("menubar"),

            open: document.getElementById("open_json"),
            save: document.getElementById("save_json"),
            add_model: document.getElementById("add_model"),

            open_input: document.getElementById("open_json_input"),
            add_model_input: document.getElementById("add_model_input")
        };

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.open.addEventListener("click", e => {
            scope.ui.open_input.click();
        });

        scope.ui.save.addEventListener("click", e => {
            const json = JSON.stringify(this.editor.toJSON(), null, 2);
            const blob = new Blob([json], {type: "application/json"});
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "scene.json";
            a.click();
            URL.revokeObjectURL(url);
        });

        scope.ui.add_model.addEventListener("click", e => {
            scope.ui.add_model_input.click();
        });

        scope.ui.open_input.addEventListener("change", e => {

            const file = e.target.files[0];
            if (!file) return;
        
            const reader = new FileReader();
            reader.readAsText(file);

            reader.onload = () => {
                const json = JSON.parse(reader.result);
                this.editor.fromJSON(json)
            }
            reader.onerror = () => {
                alert("Error reading file ", file.name);
            }
        });

        scope.ui.add_model_input.addEventListener("change", e => {

            // TODO: trying to add the same file back to back
            // does not trigger the "change"

            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.readAsText(file);

            reader.onload = () => {

                // TODO: in future parser should separate things like
                // mesh, textures, etc
                // model = {mesh: xxx, material: yyyy, texture: zzzz}
                const model = parsePLY(reader.result);
                const model_name = file.name.split(".")[0];

                // TODO: make async??? If model exists, onload doesn't finish executing because of the 
                // naming conflict, until the user closes the alert
                scope.editor.addModel2(model_name, model);
            }
            reader.onerror = () => {
                alert("Error reading file ", file.name);
            }
        });
    }
}