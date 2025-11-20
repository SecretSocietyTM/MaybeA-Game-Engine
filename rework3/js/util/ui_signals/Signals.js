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



/* checking my understanding

Signals, in my case, will be used to detect interaction with UI
which in turn will change some state. State is stored in Editor.js

Editor.js

signals = {

    objectSelected

    objectChanged
    objectAdded
    objectRemoved

    modelAdded
}

above are just a few signals I can think of

take objectSelected for example:

----------------------------
objectSelected = new Signal()

(ObjectSelected)Signal {
    this.bindings = [];
}
----------------------------

what wants to listen to this signal?
The Object Inspector UI since it wants to be able update the UI accordingly

-----------------------------

Object Inspector UI {
    this.editor

    // do something when the signal is received
    this.editor.signals.objectSelected.addListener( object => {
        this.updateUI(object);    
    })
}
-----------------------------

back in Signals, this is what happens

----------------------------

(ObjectSelected)Signal {
    this.bindings = [];
}

addListener(exampleFunction) {
 - listener_idx = -1
 - else 
    - binding = new SignalBinding(this, exampleFunction) -> signal = this, listener = exampleFunction
    this.bindings = [new SignalBinding(exampleFunction)]
}

----------------------------

then if I select something (like in the ViewWindow) 

----------------------------

mouseClick = (event) => {

    ...

    if (object === null) this.transform_controls.detachObject();
    else this.transform_controls.attachObject(object);

    ///// this.editor.signals.objectSelected.dispatch(object) //////

    this.render();
}

----------------------------

then back in Signals.js

----------------------------

(ObjectSelected)Signal {
    this.bindings = [SignalBinding(exampleFunction)];
}

dispatch(object) {
 - binding = SignalBinding(exampleFunction)
 - binding.execute(object)
}

.....

(objectSelected)SignalBinding {
    this.signal = objectSelected;
    this.listener = exampleFunction( x )
}

execute(object) {
 - exampleFunction( object )
}

----------------------------



*/