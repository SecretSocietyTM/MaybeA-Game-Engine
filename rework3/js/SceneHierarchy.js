export class SceneHierarchy {
    constructor(editor) {

        this.editor = editor;
        this.signals = editor.signals;

        this.ui = {
            container: document.getElementById("scene_hierarchy"),

            list: document.getElementById("scene_list")
        }

        // TODO: consider referencing editor.scene_objects to
        // rerender the entire list

        // current approach just appends to the list
        this.signals.objectAdded.addListener(object => {
            this.addObjectLi(object);
        });

        this.signals.objectSelected.addListener(object => {
            // TODO: add stuff to highlight the currently
            // selected object LI but properly!
        });

        this.connect();
    }

    connect() {
        const scope = this;

        scope.ui.list.addEventListener("click", e => {
            const object_li = e.target.closest("li");
            if (!object_li) return;

            // TODO: requires some reworking of selectino code
            scope.editor.selectObjectByName(object_li.dataset.name);
        });
    }

    // TODO: improve
    addObjectLi(object) {
        const li = document.createElement("li");
        li.className = "scene_list_li";
        li.dataset.name = object.name;
        li.textContent = object.name;

        this.ui.list.appendChild(li);
    }
}