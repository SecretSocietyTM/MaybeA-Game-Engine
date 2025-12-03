export class TexturesGrid {
    constructor(editor) {
        this.editor = editor;
        this.signals = editor.signals;

        this.texture_map = new Map(); // (key: name, value: url)

        this.ui = {
            container: document.getElementById("models"),

            grid: document.getElementById("textures_grid")
        };

        // signals

    }
}