import { ModelsGrid } from "./ModelsGrid.js";
import { TexturesGrid } from "./TexturesGrid.js";

export class AssetsBar {
    constructor(editor) {
        this.editor = editor;
        this.signals = editor.signals;

        this.ui = {
            container: document.getElementById("assets"),

            tabs: {
                models: document.getElementById("models_tab"),
                textures: document.getElementById("textures_tab")
            }
        };

        // connect sub elements
        this.models_grid = new ModelsGrid(editor);
        this.textures_grid = new TexturesGrid(editor);

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.tabs.models.addEventListener("click", e => {
            this.updateUI(e);
        });

        scope.ui.tabs.textures.addEventListener("click", e => {
            this.updateUI(e);
        });
    }

    updateUI(e) {

        const tabs = this.ui.tabs;
        const target = e.target;

        for (const tab in tabs) {

            const element = tabs[tab];

            if (element.classList.contains("selected_tab")) {
                element.classList.toggle("selected_tab");
            }

            this.models_grid.ui.grid.style.display = "none";
            this.textures_grid.ui.grid.style.display = "none";
        }

        target.classList.toggle("selected_tab");
        if (target.id === "models_tab") {
            this.models_grid.ui.grid.style.display = "";
        } else if (target.id === "textures_tab") {
            this.textures_grid.ui.grid.style.display = "";
        }
    }
}