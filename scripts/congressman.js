// ==========================================================================
// D3 MAIN
// ==========================================================================

function parseJson(raw_data) {
  var parsed = []
  var ids = Object.keys(raw_data)
  for (var i = 0; i < ids.length; i++) {
    idx = ids[i]
    parsed.push({
      id:           idx, 
      name:         raw_data[idx][0],
      state:        raw_data[idx][1],
      party:        raw_data[idx][2],
      legislatures: raw_data[idx][3],
      expenses:     raw_data[idx][4]
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

function presentData() {
  var congressmanId = getCheckedOptions('congressman-group')[0];
  console.log(congressmanId)
}

window.onload = function() {
  d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
    var congressmanData = parseJson(json);

    buildOptions(congressmanData, 'congressman-fieldset', 'congressman-group', 'radio', presentData);
  });
};