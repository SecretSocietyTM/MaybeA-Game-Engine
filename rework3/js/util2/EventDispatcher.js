// Copied from three.js EventDispatcher implementation which itself seems to be a copy of someone else's 
// creation. https://threejs.org/docs/?q=event#EventDispatcher

export default class EventDispatcher {
    constructor() {
        this.listeners;
    }

    addEventListener(type, listener) {
        if (this.listeners === undefined) this.listeners = {};

        const listeners = this.listeners;

        if (listeners[type] === undefined) {
            listeners[type] = [];
        }
        
        if (listeners[type].indexOf(listener) === -1) {
            listeners[type].push(listener);
        }
    }

    removeEventListener(type, listener) {
        const listeners = this.listeners;

        if (listeners === undefined) return;

        const listeners_array = listeners[type];

        if (listeners_array !== undefined) {
            const index = listeners_array.indexOf(listener);

            if (index !== -1) {
                listeners_array.splice(index, 1);
            }
        }
    }

    dispatchEvent(event) {
        const listeners = this.listeners;

        if (listeners === undefined) return;

        const listeners_array = listeners[event.type];

        if (listeners_array !== undefined) {
            event.target = this;

            const listeners_array_copy = listeners_array.slice(0);

            listeners_array_copy.forEach(listener => listener.call(this, event));
        }
    }
}