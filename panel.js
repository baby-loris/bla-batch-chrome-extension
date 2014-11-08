(function () {
    var list = document.getElementById('requestListBody');
    var clearButton = document.getElementById('clearBtn');
    var autoScrollCheckbox = document.getElementById('autoScroll');

    var TABLE_PLACEHOLDER = '<tr><td></td><td></td><td></td></tr>'; // Placeholder for drawning vertical lines
    var BLA_BATCH_NAME = 'bla-batch';
    var RESPONSE_MAX_LENGTH = 1000;
    var METHOD_VIEW_TEMPLATE = [
        '<tr class="{{className}}">',
            '<td>',
                '<a href="{{url}}" title="{{url}}" target="_blank">{{method}}</a>',
            '</td>',
            '<td>{{request}}</td>',
            '<td>{{response}}</td>',
        '</tr>'
    ].join('');

    // Set listeners
    clearButton.addEventListener('click', onClearButtonClick);
    chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);
    onClearButtonClick();

    /**
     * Clears request table.
     */
    function onClearButtonClick() {
       list.innerHTML = TABLE_PLACEHOLDER;
    }

    /**
     * Request handler.
     *
     * @param {Request} data
     */
    function onRequestFinished(data) {
        var request = data.request;
        if (isBatchRequest(request)) {
            data.getContent(function (content) {
                handleRequest(request, JSON.parse(content));
            });
        }
    }

    /**
     * Check if a request is bla-batch or not.
     *
     * @param {Object} request
     * @return {Boolean}
     */
    function isBatchRequest(request) {
        var isPostRequest = request.method === 'POST';
        var isAjaxRequest = request.headers.some(function (header) {
            return header.name === 'X-Requested-With' || header.value === 'XMLHttpRequest';
        });
        var isBlaBatchName = request.url.indexOf(BLA_BATCH_NAME) !== -1;

        return isPostRequest && isAjaxRequest && isBlaBatchName;
    }

    /**
     * @param {Object} request
     * @param {Object} response
     */
    function handleRequest(request, response) {
        var baseURL = request.url.replace(BLA_BATCH_NAME, '');
        var params = JSON.parse(request.postData.text) || {};

        Object.keys(params).forEach(function (name) {
            // bla-batch should have methods parameter
            if (name !== 'methods') {
                return;
            }

            var showBatching = params[name].length > 1;
            var items = params[name]
                .map(function (action, index) {
                    var urlParams = action.params ? '?' + querystring.stringify(action.params) : '';
                    return renderListItem({
                        className: showBatching ?
                            !index ? 'batch-start' :
                                index === params[name].length - 1 ?
                                    'batch-end' :
                                    'batch' :
                            '',
                        method: action.method,
                        url: baseURL + action.method + urlParams,
                        request: action.params,
                        response: Array.isArray(response) ? response[index] : response.data[index]
                    });
                })
                .join('');

            list.innerHTML = items + list.innerHTML;

            if (autoScrollCheckbox.checked) {
                list.firstChild.scrollIntoView(false);
            }
        });
    }

    /**
     * Renders list item with method information.
     *
     * @param {Object} data
     * @returns {String}
     */
    function renderListItem(data) {
        return METHOD_VIEW_TEMPLATE
            .replace('{{className}}', data.className)
            .replace('{{method}}', data.method)
            .replace('{{url}}', data.url, 'g')
            .replace('{{request}}', data.request ? JSON.stringify(data.request) : '')
            .replace('{{response}}', JSON.stringify(data.response).slice(0, RESPONSE_MAX_LENGTH));
    }
})();
