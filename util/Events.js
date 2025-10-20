export default class Events {
    constructor() {
        this.target = "some element";
        this.events_list = ["click", "mousemove"];
        this.events_callback = [someFunction, anotherFunction];
    }

    activateEvents() {
        this.events_list.forEach(event => {
            
        })
    }
}