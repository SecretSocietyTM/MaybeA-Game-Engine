export class SceneHierarchy {
    constructor(editor) {

        this.editor = editor;
        this.signals = editor.signals;

        this.object_map = editor.object_map; // (key: id, value: object)
        this.object_element_map = new Map(); // (key: id, value: {object, element})

        this.ui = {
            container: document.getElementById("scene_hierarchy"),

            list: document.getElementById("scene_list")
        }

        //
        // signals

        this.signals.sceneGraphChanged.addListener(object => {

            console.log("signal sceneGraphChanged received, updating Scene Hierarchy");

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

            scope.editor.selectById(+object_li.dataset.id);
        });

        scope.ui.list.addEventListener("dblclick", e => {
            const object_li = e.target.closest("li");
            if (!object_li) return;

            scope.editor.focusById(+object_li.dataset.id);
        });
    }

    updateUI() {

        this.ui.list.replaceChildren();

        for (const [id, object] of this.object_map) {
            const li = this.createLi(object);
            this.ui.list.appendChild(li);

            const new_entry = {object: object, element: li};

            this.object_element_map.set(id, new_entry);
        }

        const selected = this.editor.cur_selection?.id;

        if (selected) {
            const entry = this.object_element_map.get(selected);
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