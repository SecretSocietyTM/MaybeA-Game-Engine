export class SceneHierarchy {
    constructor(editor) {

        this.editor = editor;
        this.signals = editor.signals;

        this.object_map = new Map();
        this.object_element_map = new Map();

        this.ui = {
            container: document.getElementById("scene_hierarchy"),

            list: document.getElementById("scene_list")
        }

        // signals
        this.signals.objectAdded.addListener(object => {
            // TODO | Priority: Low - object name should be unique, could be used as id for now object name -> cube, cube1, cube2
            this.object_map.set(object, object.name);

            this.updateUI();
        });

        this.signals.objectSelected.addListener(object => {
            this.updateUI();

        });

        this.signals.objectChanged.addListener(object => {
            this.object_map.set(object, object.name);

            this.updateUI();
        });

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.list.addEventListener("click", e => {
            const object_li = e.target.closest("li");
            if (!object_li) return;

            scope.editor.selectObjectByName(object_li.dataset.name);
        });
    }

    updateUI() {

        this.ui.list.replaceChildren();

        for (const [object, name] of this.object_map) {
            const li = this.createLi({name});
            this.ui.list.appendChild(li);

            this.object_element_map.set(object, li);
        }

        const selected = this.editor.cur_selection;

        if (selected) {
            const li = this.object_element_map.get(selected);
            li.classList.add("selected");
        }

    }

    createLi(object_info) {
        const li = document.createElement("li");
        li.className = "scene_list_li";
        li.dataset.name = object_info.name;
        li.textContent = object_info.name;

        return li;
    }
}