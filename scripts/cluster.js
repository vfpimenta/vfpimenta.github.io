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

function parseCsv(rawData) {
  var parsed = []
  for (var i = 0; i < rawData.length; i++) {
    parsed.push({
      id:   rawData[i].Subquota, 
      name:   rawData[i].Subquota
    })
  }
  return parsed
};

function changeDataset() {
  TimeSeries.selectedOptions = [];
  Graph.changeDataset(); 
  TimeSeries.changeDataset();
}

function summaryBuilder(ul) {
  if(ul === undefined){
    var ul = document.createElement('ul')
    ul.id = "details"
  }

  return function(str) {
    var li = document.createElement('li')
    var text = document.createTextNode(str)
    li.appendChild(text)
    ul.appendChild(li)

    return ul
  } 
}

function fillSummary(nodes) {
  if(nodes && nodes.length > 0) {
    // Constant definition
    var topStates = nodes.map(d=>d.state).top(3).map(o=>o.d+"("+o.n+")").join(",");
    var topParties = nodes.map(d=>d.party).top(3).map(o=>o.d+"("+o.n+")").join(",");
    var expenseAbsolute = TimeSeries.congressmanTimeSeries.filter(function(congressman) {
      return nodes.map(d=>d.congressman_id).includes(congressman.id)
    }).reduce(function(acc, el) {
      return acc + el.expenses.reduce((a,b)=>a+b);
    }, 0);
    var expenseRate = expenseAbsolute / TimeSeries.congressmanTimeSeries.reduce(function(acc, el) {
      return acc + el.expenses.reduce((a,b)=>a+b);
    }, 0);

    // Clear contents
    document.getElementById("summary-placeholder").setAttribute("style", "display: none;")
    var details = document.getElementById("details")
    if(details){
      details.parentNode.removeChild(details);
    }

    // Add children
    var build = summaryBuilder()
    build("Cluster composed of congressman of the following top states: "+topStates.toString())
    build("Composed of the following top parties: "+topParties.toString())
    var summary = build("This cluster has a total of $"+expenseAbsolute.toFixed(2)+" expended during the selected legislature, totaling "+(expenseRate*100).toFixed(2)+"% of the total.")
    
    document.getElementById('summary').appendChild(summary)
  } else {
    document.getElementById("summary-placeholder").setAttribute("style", "display: auto;")
    var details = document.getElementById("details")
    if(details){
      details.parentNode.removeChild(details);
    }
  }
}

window.onload = function() {
  Graph.init();
  TimeSeries.init();

  d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
    TimeSeries.parseJson(json).then(function(result) {
      var congressmanData = result;

      buildOptions(congressmanData, 'congressman-fieldset', 'congressman-group', 'checkbox', function() {Graph.highlightNodes('congressman-group', 'congressman_id'); TimeSeries.changeSelection('congressman-group', 'id');});

      buildOptions(congressmanData.map(d=>d.state).unique().map(function(state){return {id: state, name: state}}), 'state-fieldset', 'state-group', 'checkbox', function() {Graph.highlightNodes('state-group', 'state'); TimeSeries.changeSelection('state-group', 'state');});

      buildOptions(congressmanData.map(d=>d.party).unique().map(function(party){return {id: party, name: party}}), 'party-fieldset', 'party-group', 'checkbox', function() {Graph.highlightNodes('party-group', 'party'); TimeSeries.changeSelection('party-group', 'party');});
    });
  });

  d3.csv('../../data/subquota.csv').then(function(csv) {
    var subquota = parseCsv(csv);

    buildOptions(subquota, 'subquota-fieldset', 'subquota-group', 'radio', changeDataset);
  });
}

Array.prototype.unique = function(){
  return Array.from(new Set(this));
}

Array.prototype.top = function(limit) {
  var obj = this.reduce(function(acc, val) {
    acc[val] = (acc[val] || 0) + 1; return acc;
  }, {})

  var list = [];
  for (k in obj) list.push({d: k, n: obj[k]});
  list.sort(function(a,b){ return b.n-a.n });

  return list.slice(0, limit);
}