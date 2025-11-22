export class SceneHierarchy {
    constructor(editor) {

        this.editor = editor;
        this.signals = editor.signals;

        this.object_map = new Map(); // (key: id, value: {object, element})

        this.ui = {
            container: document.getElementById("scene_hierarchy"),

            list: document.getElementById("scene_list")
        }

        // signals
        this.signals.objectAdded.addListener(object => {
            const entry = {object: object, element: null};

            this.object_map.set(object.id, entry);

            this.updateUI();
        });

        this.signals.objectSelected.addListener(object => {
            this.updateUI();

        });

        this.signals.objectChanged.addListener(object => {
            this.updateUI();
        });

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.list.addEventListener("click", e => {
            const object_li = e.target.closest("li");
            if (!object_li) return;

            scope.editor.selectObjectById(+object_li.dataset.id);
        });
    }

    updateUI() {

        this.ui.list.replaceChildren();

        for (const [id, entry] of this.object_map) {
            const li = this.createLi(entry.object);
            this.ui.list.appendChild(li);

            const new_entry = {object: entry.object, element: li};

            this.object_map.set(id, new_entry);
        }

        const selected = this.editor.cur_selection?.id;

        if (selected) {
            const entry = this.object_map.get(selected);
            entry.element.classList.add("selected");
        
        }
    }

    createLi(object) {
        const li = document.createElement("li");
        li.className = "scene_list_li";
        li.dataset.name = object.name;
        li.dataset.id = object.id;
        li.textContent = object.name;

        return li;
    }
}