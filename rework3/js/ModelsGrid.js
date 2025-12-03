export class ModelsGrid {
    constructor(editor) {
        this.editor = editor;
        this.signals = editor.signals;

        this.model_map = new Map(); // (key: name, value: url)

        this.ui = {
            container: document.getElementById("assets"),

            grid: document.getElementById("models_grid")
        };

        // signals

        this.signals.modelAdded.addListener(model_info => {
            this.model_map.set(model_info.name, model_info.url);

            this.updateUI();
        });

        this.signals.modelRemoved.addListener(model_name => {
            this.model_map.delete(model_name);

            this.updateUI();
        });

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.grid.addEventListener("mouseup", e => {

            const model_card = e.target.closest("div");

            if (!model_card) return;

            const model_name = model_card.dataset.name;

            if (e.button === 0) {
                // add object with model

                scope.editor.addObjectFromModel(model_name);
            } else if (e.button === 1) { 
                // TODO | Priority: Low -  ideally have a little pop up with options (rename, delete) on a right click e.button === 2
                // delete model / objects with model

                scope.editor.removeModel2(model_name);
            }
        });
    }

    updateUI() {
        this.ui.grid.replaceChildren();

        for (const [name, url] of this.model_map) {
            const card = this.createCard({name, url});
            this.ui.grid.appendChild(card);
        }
    }

    createCard(model_info) {
        const card = document.createElement("div");
        card.className = "models_card";
        card.dataset.name = model_info.name;

        const img = document.createElement("img");
        img.className = "models_card__img";
        img.src = model_info.url;

        const p = document.createElement("p");
        p.textContent = model_info.name;

        card.appendChild(img);
        card.appendChild(p);

        return card;
    }
}