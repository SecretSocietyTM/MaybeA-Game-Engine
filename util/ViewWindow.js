import Renderer from "./Renderer.js";
import Camera from "./Camera.js";


// TODO: window class should also store its own projection matrix
export default class ViewWindow {
    constructor(canvas) {
        this.canvas = canvas;

        this.camera = new Camera([5,2,5], [0,0,0], [0,1,0]);
        this.renderer = new Renderer(this.canvas);
    }
}