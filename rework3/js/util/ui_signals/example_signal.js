(function (global) {
    // =========================================================
    //  SignalBinding
    // =========================================================
    // Represents a single connection between a Signal and a listener function
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {
        this._listener = listener;
        this._isOnce = isOnce;
        this.context = listenerContext;
        this._signal = signal;
        this._priority = priority || 0;
        this.active = true;
        this.params = null;
    }

    SignalBinding.prototype = {

        execute: function (paramsArr) {
            if (!this.active || !this._listener) return;

            var params;
            // If binding has its own params, append them
            if (this.params) {
                params = this.params.concat(paramsArr);
            } else {
                params = paramsArr;
            }

            var result = this._listener.apply(this.context, params);

            // If it's a once-only listener, remove it after calling
            if (this._isOnce) this.detach();

            return result;
        },

        detach: function () {
            return this.isBound() ? this._signal.remove(this._listener, this.context) : null;
        },

        isBound: function () {
            return !!this._signal && !!this._listener;
        },

        isOnce: function () {
            return this._isOnce;
        },

        getListener: function () {
            return this._listener;
        },

        getSignal: function () {
            return this._signal;
        },

        _destroy: function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        toString: function () {
            return '[SignalBinding isOnce:' + this._isOnce +
                ', isBound:' + this.isBound() +
                ', active:' + this.active + ']';
        }

    };

    // =========================================================
    //  Signal
    // =========================================================
    // A Signal manages a list of listeners (SignalBindings)
    function Signal() {
        this._bindings = [];
        this._prevParams = null;
        this.memorize = false;
        this._shouldPropagate = true;
        this.active = true;
    }

    Signal.prototype = {

        VERSION: '1.0.0',

        // Registers a listener
        _registerListener: function (listener, isOnce, listenerContext, priority) {
            var existingIndex = this._indexOfListener(listener, listenerContext);

            if (existingIndex !== -1) {
                var existing = this._bindings[existingIndex];
                if (existing.isOnce() !== isOnce) {
                    throw new Error(
                        'You cannot add' + (isOnce ? '' : 'Once') + '() then add' +
                        (!isOnce ? '' : 'Once') +
                        '() the same listener without removing the relationship first.'
                    );
                }
            } else {
                var binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
                if (this.memorize && this._prevParams) {
                    binding.execute(this._prevParams);
                }
                return binding;
            }
        },

        // Adds a binding sorted by priority
        _addBinding: function (binding) {
            var n = this._bindings.length;
            do { n--; }
            while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);

            this._bindings.splice(n + 1, 0, binding);
        },

        // Returns the index of a listener if found
        _indexOfListener: function (listener, context) {
            for (var i = this._bindings.length; i--;) {
                var binding = this._bindings[i];
                if (binding._listener === listener && binding.context === context) {
                    return i;
                }
            }
            return -1;
        },

        has: function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        add: function (listener, context, priority) {
            this._validateListener(listener, 'add');
            return this._registerListener(listener, false, context, priority);
        },

        addOnce: function (listener, context, priority) {
            this._validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, context, priority);
        },

        remove: function (listener, context) {
            this._validateListener(listener, 'remove');
            var index = this._indexOfListener(listener, context);
            if (index !== -1) {
                this._bindings[index]._destroy();
                this._bindings.splice(index, 1);
            }
            return listener;
        },

        removeAll: function () {
            for (var i = this._bindings.length; i--;) {
                this._bindings[i]._destroy();
            }
            this._bindings.length = 0;
        },

        getNumListeners: function () {
            return this._bindings.length;
        },

        halt: function () {
            this._shouldPropagate = false;
        },

        dispatch: function () {
            if (!this.active) return;

            var paramsArr = Array.prototype.slice.call(arguments);
            var n = this._bindings.length, bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (n) {
                bindings = this._bindings.slice(); // clone in case modified during dispatch
                this._shouldPropagate = true;

                do {
                    n--;
                } while (bindings[n] &&
                         this._shouldPropagate &&
                         bindings[n].execute(paramsArr) !== false);
            }
        },

        forget: function () {
            this._prevParams = null;
        },

        dispose: function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        _validateListener: function (listener, fnName) {
            if (typeof listener !== 'function') {
                throw new Error('Listener is a required param of ' + fnName + '() and should be a function.');
            }
        },

        toString: function () {
            return '[Signal active:' + this.active +
                ' numListeners:' + this.getNumListeners() + ']';
        }

    };

    // =========================================================
    //  Export
    // =========================================================
    var signals = Signal;
    signals.Signal = Signal;

    if (typeof define === 'function' && define.amd) {
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = signals;
    } else {
        global.signals = signals;
    }

})(this);