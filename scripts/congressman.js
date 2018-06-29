// ==========================================================================
// D3 MAIN
// ==========================================================================

function parseJson(rawData) {
  var parsed = []
  var ids = Object.keys(rawData)
  for (var i = 0; i < ids.length; i++) {
    idx = ids[i]
    parsed.push({
      id:           idx, 
      name:         rawData[idx][0],
      state:        rawData[idx][1],
      party:        rawData[idx][2],
      legislatures: rawData[idx][3],
      expenses:     rawData[idx][4]
    })
  }

  return parsed;
};

function buildOptions(dataset, parentFieldset, groupName, type, eventListener){
  var fieldset = document.getElementById(parentFieldset)

  // Sorting options alphabetically
  dataset = dataset.sort(function(a, b) {
    if (a.name > b.name) {
      return 1;
    }else if (a.name < b.name) {
      return -1;
    }else{
      return 0;
    }
  })

  for (var i = 0; i < dataset.length; i++) {
    var checkbox = createNewBox(groupName, dataset[i].id, type)
    addListener(checkbox, 'click', eventListener)

    var span = document.createElement('span')
    span.innerHTML = dataset[i].name

    fieldset.appendChild(checkbox)
    fieldset.appendChild(span)
    fieldset.appendChild(document.createElement('br'))
  }
};

function createNewBox(name, id, type){
    var checkbox = document.createElement('input'); 
    checkbox.type = type;
    checkbox.name = name;
    checkbox.id = id;
    return checkbox;
};

function addListener(element, eventName, handler) {
  if (element.addEventListener) {
    element.addEventListener(eventName, handler, false);
  }
  else if (element.attachEvent) {
    element.attachEvent('on' + eventName, handler);
  }
  else {
    element['on' + eventName] = handler;
  }
};

function getCheckedOptions(groupName) {
  var checked = []
  var congressmanBoxes = document.getElementsByName(groupName)
  for (var i = 0; i < congressmanBoxes.length; i++) {
    if(congressmanBoxes[i].checked){
      checked.push(congressmanBoxes[i].id)
    }
  }

  return checked
};

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
        document.body.appendChild(scriptEl);

    };
}

function fillBasicData(rawString) {
  //$NAME - $PARTY/$STATE
  var name = rawString.match(/.* -/)[0].replace(/-/g, "");
  var party = rawString.match(/-.*\//)[0].replace(/(-|\/| )/g, "");
  var state = rawString.match(/\/.*/)[0].replace(/\//g, "");

  document.getElementById('field-name').innerHTML = name;
  document.getElementById('field-party').innerHTML = party;
  document.getElementById('field-state').innerHTML = state;
  document.getElementById('info').style.display = "inherit";

  var photo = document.createElement('img');
  photo.src = "http://www.camara.gov.br/internet/deputado/bandep/" + window.congressmanId + ".jpg";

  var photoNode = document.getElementById('image-container');
  if(photoNode.firstChild) photoNode.removeChild(photoNode.firstChild);
  photoNode.appendChild(photo);
}

function fillLegislature(rawString) {
  document.getElementById('info-rest').style.display = "inherit";
  document.getElementById('text').innerHTML = rawString;
}

function presentData() {
  window.congressmanId = getCheckedOptions('congressman-group')[0];
  fetchAndDeliver('//div[@class="bioNomParlamentrPartido"]/text()', fillBasicData);
  fetchAndDeliver('//div[@class="bioOutrosTexto"]/text()', fillLegislature);
}

function fetchAndDeliver(xpath, action) {
  //var xpath = '//div[@class="bioNomParlamentrPartido"]/text()'
  
  var query = 'select * from htmlstring where url="http://www2.camara.leg.br/deputados/pesquisa/layouts_deputados_biografia?pk=' + window.congressmanId + '" and xpath=\'' + xpath + '\'';

  var callback = function(data) {
    action(data.query.results.result)
  };

  new YQLQuery(query, callback).fetch();
}

window.onload = function() {
  d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
    var congressmanData = parseJson(json);

    buildOptions(congressmanData, 'congressman-fieldset', 'congressman-group', 'radio', presentData);
  });
};