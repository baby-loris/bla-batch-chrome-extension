(function (global) {

    function addParam(res, name, val) {
        /* jshint eqnull: true */
        var value = typeof value === 'object' ? JSON.stringify(val) : val;
        res.push(encodeURIComponent(name) + '=' + (value == null ? '' : encodeURIComponent(value)));
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
