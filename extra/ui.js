export function loadSceneObjectsToList(list, objects) {
    objects.forEach(object => {
        addSceneObjectToList(list, object);
    });
}

export function addSceneObjectToList(list, object) {
    const p = document.createElement("p");
    p.textContent = object.name;
    list.appendChild(p);
}

export function setTransformUI(transform_ui, object) {
    setPositionUI(transform_ui.position, object);
    setScaleUI(transform_ui.scale, object);
    setRotationUI(transform_ui.rotation, object);
}

export function addModelCardToGrid(grid, name, model_preview_url) {
    const div = document.createElement("div");
    const img = document.createElement("img");
    const p = document.createElement("p");

    div.dataset.model_name = name;
    p.textContent = name;
    img.className = "model_preview";
    img.src = model_preview_url;
    img.style.transform = "scaleY(-1)";

    div.appendChild(img);
    div.appendChild(p);

    grid.appendChild(div);
}

function setPositionUI(position_ui, object) {
    position_ui.x.value = object.pos[0];
    position_ui.y.value = object.pos[1];
    position_ui.z.value = object.pos[2];
}

function setScaleUI(scale_ui, object) {
    scale_ui.x.value = object.scale[0];
    scale_ui.y.value = object.scale[1];
    scale_ui.z.value = object.scale[2];    
}

function setRotationUI(rotation_ui, object) {
    rotation_ui.x.value = object.rotation_angles[0];
    rotation_ui.y.value = object.rotation_angles[1];
    rotation_ui.z.value = object.rotation_angles[2];
}