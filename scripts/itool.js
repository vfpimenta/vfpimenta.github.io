function buildOptions(dataset, parentFieldset, groupName, type, eventListener){
  var fieldset = document.getElementById(parentFieldset)

  // Sorting options alphabetically
  dataset = dataset.sort(function(argA, argB) {
    if (argA.name > argB.name) {
      return 1;
    }else if (argA.name < argB.name) {
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

function parseCsv(raw_data) {
  var parsed = []
  for (var i = 0; i < raw_data.length; i++) {
    parsed.push({
      id:   raw_data[i].Subquota, 
      name:   raw_data[i].Subquota
    })
  }
  return parsed
};

function changeDataset(argument) {
  window.selectedCongressman = [];
  Graph.changeDataset(); 
  TimeSeries.changeDataset();
}

window.onload = function(argument) {
  Graph.init();
  TimeSeries.init();

  d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
    TimeSeries.parseJson(json).then(function(result) {
      var congressmanData = result;

      buildOptions(congressmanData, 'congressman-fieldset', 'congressman-group', 'checkbox', function() {Graph.highlightNodes(); TimeSeries.changeSelection();});

      buildOptions(Array.from(new Set(congressmanData.map(d=>d.state))).map(function(state){return {id: state, name: state}}), 'state-fieldset', 'state-group', 'checkbox', function() {console.log(1)});

      buildOptions(Array.from(new Set(congressmanData.map(d=>d.party))).map(function(party){return {id: party, name: party}}), 'party-fieldset', 'party-group', 'checkbox', function() {console.log(1)});
    });
  });

  d3.csv('../../data/subquota.csv').then(function(csv) {
    var subquota = parseCsv(csv);

    buildOptions(subquota, 'subquota-fieldset', 'subquota-group', 'radio', changeDataset);
  });
}