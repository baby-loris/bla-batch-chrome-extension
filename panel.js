(function() {
    var list = document.getElementById('requestList');

    var clearBtn = document.getElementById('clearBtn');
    clearBtn.addEventListener('click', function() {
       list.innerHTML = '';
    });

    var autoScrollCheckbox = document.getElementById('autoScroll');

    addRequestListener();

    function addRequestListener() {
        chrome.devtools.network.onRequestFinished.addListener(function(data) {
            if(data.request.method !== 'POST' ||
               data.request.headers.every(function(h) {
                   return h.name !== 'X-Requested-With' || h.value !== 'XMLHttpRequest'
               }) ||
               data.request.url.indexOf('/api/batch') === -1) {
                return;
            }

            var baseURL = data.request.url.substr(0, data.request.url.lastIndexOf('/api/') + 5);

            data.request.postData.params && data.request.postData.params.forEach(function(param) {
                if(param.name !== 'actions') return;

                var actions = JSON.parse(decodeURIComponent(param.value));
                actions.forEach(function(action) {
                    var url = baseURL + action.name;
                    var params;
                    if(action.params) {
                        params = JSON.stringify(action.params);
                        url += '?' + querystring.stringify(action.params);
                    }

                    var noxslUrl = url.replace(/\.ru(:\d+)?/g, function(_, port) {
                        port || (port = ':80');
                        return '.ru' + port + '80';
                    });
                    addListItem(
                        '<a href="' + url + '" title="' + url + '" target="_blank">' + action.name + '</a>',
                        '<a href="' + noxslUrl + '" title="' + noxslUrl + '" target="_blank">noxsl</a>',
                        params);
                });
            });
        });
    }

    function addListItem(col1, col2, col3) {
        var listItem = document.createElement('tr');
        listItem.innerHTML =
            '<td>' + (col1 || '') + '</td>' +
            '<td>' + (col2 || '') + '</td>' +
            '<td>' + (col3 || '') + '</td>';
        list.appendChild(listItem);

        if(autoScrollCheckbox.checked) {
            listItem.scrollIntoView(false);
        }
    }
})();
