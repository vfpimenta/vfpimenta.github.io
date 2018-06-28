function YQLQuery(query, callback) {
    this.query = query;
    this.callback = callback || function(){};
    this.fetch = function() {

        if (!this.query || !this.callback) {
            throw new Error('YQLQuery.fetch(): Parameters may be undefined');
        }

        var scriptEl = document.createElement('script'),
            uid = 'yql' + +new Date(),
            encodedQuery = encodeURIComponent(this.query),
            instance = this;

        YQLQuery[uid] = function(json) {
            instance.callback(json);
            delete YQLQuery[uid];
            document.body.removeChild(scriptEl);
        };

        scriptEl.src = 'http://query.yahooapis.com/v1/public/yql?q='
                     + encodedQuery + '&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&format=json&callback=YQLQuery.' + uid; 
        console.log(scriptEl.src)
        document.body.appendChild(scriptEl);

    };
}

// Construct your query:
var query = 'select * from htmlstring where url="http://www2.camara.leg.br/deputados/pesquisa/layouts_deputados_biografia?pk=178957" and xpath=\'//div[@class="bioNomParlamentrPartido"]/text()\'';

// Define your callback:
var callback = function(data) {
    console.log(data.query.results.result)
};

// Instantiate with the query:
var firstFeedItem = new YQLQuery(query, callback);

// If you're ready then go:
firstFeedItem.fetch(); // Go!!