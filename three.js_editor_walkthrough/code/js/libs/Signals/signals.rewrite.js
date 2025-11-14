class SignalBinding {
    constructor(signal, listener, isOnce, context, priority = 0) {
        this._listener = listener;
        this._isOnce = isOnce;
        this.context = context;
        this._signal = signal;
        this._priority = priority;
        this.active = true;
        this.params = null;
    }

    execute(paramsArr) {
        if (!this.active || !this._listener) return;

        const params = this.params
            ? this.params.concat(paramsArr)
            : paramsArr;

        const result = this._listener.apply(this.context, params);
        if (this._isOnce) this.detach();
        return result;
    }

    detach() {
        return this.isBound()
            ? this._signal.remove(this._listener, this.context)
            : null;
    }

    isBound() { return !!this._signal && !!this._listener; }
    isOnce() { return this._isOnce; }
    getListener() { return this._listener; }
    getSignal() { return this._signal; }

    _destroy() {
        this._signal = null;
        this._listener = null;
        this.context = null;
    }
}

class Signal {
    constructor() {
        this._bindings = [];
        this._prevParams = null;
        this.memorize = false;
        this._shouldPropagate = true;
        this.active = true;
    }

    add(listener, context, priority) {
        return this._registerListener(listener, false, context, priority);
    }

    addOnce(listener, context, priority) {
        return this._registerListener(listener, true, context, priority);
    }

    remove(listener, context) {
        const index = this._indexOfListener(listener, context);
        if (index !== -1) {
            this._bindings[index]._destroy();
            this._bindings.splice(index, 1);
        }
        return listener;
    }

    dispatch(...params) {
        if (!this.active) return;
        if (this.memorize) this._prevParams = params;

        const bindings = [...this._bindings];
        this._shouldPropagate = true;

        for (let i = bindings.length - 1; i >= 0; i--) {
            if (!this._shouldPropagate) break;
            const result = bindings[i].execute(params);
            if (result === false) break;
        }
    }
}
