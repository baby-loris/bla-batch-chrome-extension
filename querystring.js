(function(global) {

    function addParam(res, name, val) {
        res.push(encodeURIComponent(name) + '=' + (val == null? '' : encodeURIComponent(val)));
    }

    global.querystring = {
        /**
         * Serialize an object to a query string.
         *
         * @param {Object} obj
         * @returns {String}
         */
        stringify : function(obj) {
            return Object.keys(obj)
                .reduce(
                function(res, name) {
                    var val = obj[name];
                    Array.isArray(val)?
                        val.forEach(function(val) {
                            addParam(res, name, val);
                        }) :
                        addParam(res, name, val);
                    return res;
                },
                [])
                .join('&');
        }
    };

})(this);
