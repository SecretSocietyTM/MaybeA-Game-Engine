export default {
    canvas: document.getElementById("canvas"),
    views: [],

    start_pos: null,
    start_pos2: null,

    cur_selection: null,
    
    cur_x: null,
    cur_y: null,
    prev_x: null,
    prev_y: null,

    pan_camera: false,
    orbit_camera: false,

    current_ray: {
        origin: null,
        dir: null
    }
};