(function () {
    var list = document.getElementById('requestListBody');
    var clearButton = document.getElementById('clearBtn');
    var autoScrollCheckbox = document.getElementById('autoScroll');

    var TABLE_PLACEHOLDER = '<tr><td></td><td></td><td></td></tr>'; // Placeholder for drawning vertical lines
    var BLA_BATCH_NAME = 'batch';
    var RESPONSE_MAX_LENGTH = 1000;
    var COPY_BUTTON_TEMPLATE = '<button class="copy">copy</button>';
    var METHOD_VIEW_TEMPLATE = [
        '<tr class="{{className}}">',
            '<td>',
                '<a href="{{url}}" title="{{url}}" target="_blank">{{method}}</a>',
            '</td>',
            '<td><span>{{request}}</span>' + COPY_BUTTON_TEMPLATE + '</td>',
            '<td><span class="hidden">{{full-response}}</span>{{response}}' + COPY_BUTTON_TEMPLATE + '</td>',
        '</tr>'
    ].join('');

    // Set listeners
    clearButton.addEventListener('click', onClearButtonClick);
    list.addEventListener('click', onListClick);
    chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);
    onClearButtonClick();

    /**
     * @param {DOMEvent} event
     */
    function onListClick(event) {
        if (event.target.classList.contains('copy')) {
            copyTextToClipboard(event.target.parentNode.firstChild.innerHTML);
        }
    }

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

        // support urlencoded post bodies
        var params = request.postData.params ?
            request.postData.params.reduce(function (result, param) {
                result[param.name] = param.value;
                return result;
            }, {}) :
            JSON.parse(request.postData.text) || {};

        // bla-batch should have methods parameter
        var batch = params.methods;
        if (!batch) {
            return;
        }

        var methods = typeof batch === 'string' ? JSON.parse(decodeURIComponent(batch)) : batch;
        var showBatching = methods.length > 1;
        var items = methods
            .map(function (action, index) {
                var urlParams = action.params ? '?' + querystring.stringify(action.params) : '';
                return renderListItem({
                    className: showBatching ?
                        !index ? 'batch-start' :
                            index === methods.length - 1 ?
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

        list.removeChild(list.lastChild);
        list.innerHTML = list.innerHTML + items + TABLE_PLACEHOLDER;

        if (autoScrollCheckbox.checked) {
            list.lastChild.scrollIntoView(false);
        }
    }

    /**
     * Renders list item with method information.
     *
     * @param {Object} data
     * @returns {String}
     */
    function renderListItem(data) {
        var response = JSON.stringify(data.response);
        return METHOD_VIEW_TEMPLATE
            .replace('{{className}}', data.className)
            .replace('{{method}}', data.method)
            .replace(/\{\{url\}\}/g, data.url)
            .replace('{{request}}', data.request ? JSON.stringify(data.request) : '')
            .replace('{{response}}', response.slice(0, RESPONSE_MAX_LENGTH))
            .replace('{{full-response}}', response);
    }

    /**
     * @param {String} text
     */
    function copyTextToClipboard(text) {
        var textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = text;
        textarea.select();
        document.execCommand('copy', true);
        document.body.removeChild(textarea);
    }
})();
