SignalBinding.protoype = {
    execute: function (paramsArr) {
        let handlerReturn, params;
        if (this.active && !!this.listener) {
            params = this.params ? this.params.concat(paramsArr) : paramsArr;
            handlerReturn = this._listener.apply(this.context, params);
            if (this._isOnce) this.detach();
        }
        return handlerReturn;
    }
}
_listener