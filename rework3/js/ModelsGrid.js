export class ModelsGrid {
    constructor(editor) {
        this.editor = editor;
        this.signals = editor.signals;

        this.ui = {
            container: document.getElementById("models"),

            grid: document.getElementById("models_grid")
        };

        this.signals.modelAdded.addListener(model_info => {
            this.updateUI(model_info);
        });

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.grid.addEventListener("click", e => {
            const model_card = e.target.closest("div");
            if (!model_card) return;

            // TODO: consider changing where this happens
            scope.editor.addObjectFromModel(model_card.dataset.name);
        });
    }

    updateUI(model_info) {
        this.ui.grid.appendChild(this.createCard(model_info));
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