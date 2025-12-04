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

        this.signals.textureAdded.addListener(tex_info => {
            this.texture_map.set(tex_info.name, tex_info.url);

            this.updateUI();
        });

        this.signals.textureRemoved.addListener(tex_name => {
            this.texture_map.delete(tex_name);

            this.updateUI();
        });

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.grid.addEventListener("mouseup", e => {

            const tex_card = e.target.closest("div");

            if (!tex_card) return;

            const tex_name = tex_card.dataset.name;

            if (e.button === 0) {

                const object = scope.editor.cur_selection;

                if (object === null) return;

                scope.editor.assignTextureToObject(object, tex_name);
            } else if (e.button === 1) {
                scope.editor.removeTexture(tex_name);
            }
        });
    }

    updateUI() {
        this.ui.grid.replaceChildren();

        for (const [name, url] of this.texture_map) {
            const card = this.createCard({name, url});
            this.ui.grid.appendChild(card);
        }
    }

    createCard(tex_info) {
        const card = document.createElement("div");
        card.className = "models_card";
        card.dataset.name = tex_info.name;

        const img = document.createElement("img");
        img.className = "models_card__img";
        img.src = tex_info.url;

        const p = document.createElement("p");
        p.textContent = tex_info.name;

        card.appendChild(img);
        card.appendChild(p);

        return card;
    }
}