// copying the signals implementation from three.js which credits the person below
/*
 JS Signals <http://millermedeiros.github.com/js-signals/>
 Released under the MIT license
 Author: Miller Medeiros
 Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
*/

class SignalBinding {
    constructor(signal, listener) {
        this.signal = signal;
        this.listener = listener;
    }

    execute(data) {
        if (!this.listener) return;

        const result = this.listener(data);
        return result;
    }
}

export class Signal {
    constructor() {
        this.bindings = [];
    }

    addListener(listener) {
        if (typeof listener !== "function") {
            throw new Error("listener is now a function");
        }

        let listener_idx = this.indexOfListener(listener);

        if (listener_idx !== -1) {
            return // listener already exists
        } else {
            let binding = new SignalBinding(this, listener);
            this.bindings.push(binding);
        }
    }

    removeListener(listener) {
        if (typeof listener !== "function") {
            throw new Error("listener is now a function");
        }

        let listener_idx = this.indexOfListener(listener);
        
        if (listener_idx !== -1) {
            this.bindings.splice(listener_idx, 1);
        }
    }

    indexOfListener(listener) {
        for (let i = 0; i < this.bindings.length; i++) {
            let binding = this.bindings[i];
            if (binding.listener === listener) return i;
        }
        return -1;
    }

    dispatch(data) {
        this.bindings.forEach(binding => {
            binding.execute(data);
        })
    }
}