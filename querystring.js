(function (global) {

    function addParam(res, name, val) {
        /* jshint eqnull: true */
        res.push(encodeURIComponent(name) + '=' + (val == null ? '' : encodeURIComponent(val)));
    }

    global.querystring = {
        /**
         * Serialize an object to a query string.
         *
         * @param {Object} obj
         * @returns {String}
         */
        stringify: function (obj) {
           return Object.keys(obj)
                .reduce(function (result, name) {
                    var value = obj[name];
                    if (Array.isArray(value)) {
                        value.forEach(function (value) {
                            addParam(result, name, value);
                        });
                    } else {
                        addParam(result, name, value);
                    }
                    return result;
                }, [])
                .join('&');
        }
    };

})(this);
