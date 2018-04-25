// ============================================================================
// OPTIONS
// ============================================================================

function buildOptions(dataset, parentFieldset, groupName, type, eventListener){
  var fieldset = document.getElementById(parentFieldset)

  for (var i = 0; i < dataset.length; i++) {
    var checkbox = createNewBox(groupName, dataset[i].id, type)
    addListener(checkbox, 'click', eventListener)

    var span = document.createElement('span')
    span.innerHTML = dataset[i].name

    fieldset.appendChild(checkbox)
    fieldset.appendChild(span)
    fieldset.appendChild(document.createElement('br'))
  }
}

function createNewBox(name, id, type){
    var checkbox = document.createElement('input'); 
    checkbox.type = type;
    checkbox.name = name;
    checkbox.id = id;
    return checkbox;
}

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
}

function getCheckedOptions(groupName) {
  var checked = []
  var congressmanBoxes = document.getElementsByName(groupName)
  for (var i = 0; i < congressmanBoxes.length; i++) {
    if(congressmanBoxes[i].checked){
      checked.push(congressmanBoxes[i].id)
    }
  }

  return checked
}

// ============================================================================
// D3 MAIN
// ============================================================================

function updateSVG(){
  d3.select("svg").selectAll("g").remove()

  var svg = d3.select("svg")
  var width = +d3.select("svg").attr("width")
  var height = +d3.select("svg").attr("height")
  var radius = 5

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().distanceMax(60))
    .force("center", d3.forceCenter(width / 2, height / 2));

  var link = svg.append("g")
    .attr("class", "links")
  .selectAll("line")
  .data(window.graph.links)
  .enter().append("line")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .attr("style", "stroke: #999; stroke-opacity: 0.6;");

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(window.graph.nodes)
    .enter().append("circle")
      .attr("r", function(d){
        var lScale = d3.scaleLog()
        .domain(d3.extent(window.graph.nodes.map(d=>d.size)))
        .range([0, 3]);

        return 3+lScale(d.size);
      })
      .attr("fill", function(d) { return color(d.group); })
      .attr("style", "stroke: #fff; stroke-width: 1.5px;")
      .attr("name", d=>d.name)
      .call(d3.drag()
          .on("start", function(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", function(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
          })
          .on("end", function(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }));

  node.append("title")
      .text(function(d) { return d.name; });

  var nGroups = [...new Set(window.graph.nodes.map(n=>n.group))].length
  var groupScaleX = scaleAngle('x', nGroups, 0.3)
  var groupScaleY = scaleAngle('y', nGroups, 0.3)

  simulation
      .nodes(window.graph.nodes)
      .on("tick", function() {
        link
          .attr("x1", function(d) { return groupScaleX(d.source.x, d.source.group); })
          .attr("y1", function(d) { return groupScaleY(d.source.y, d.source.group); })
          .attr("x2", function(d) { return groupScaleX(d.target.x, d.target.group); })
          .attr("y2", function(d) { return groupScaleY(d.target.y, d.target.group); });

        node
          .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, groupScaleX(d.x, d.group))); })
          .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, groupScaleY(d.y, d.group))); });
      });

  simulation.force("link")
      .links(window.graph.links);
}

function scaleAngle(coordinate, nGroups, radius){
  var degree = 360 / nGroups;
  var radian = degree * Math.PI / 180;

  switch(coordinate){
    case 'x':
      return function(value, group) {
        return value + Math.cos(group*radian)*radius;
      }
    case 'y':
      return function(value, group) {
        return value + Math.sin(group*radian)*radius;
      }
  }
}

function changeDataset() {
  var checkedRadio = getCheckedOptions('subquota-group')[0]
  if (checkedRadio == 'NONE') {
    checkedRadio = ''
  }

  if (window.normalize){
    path = '../../data/graph-json/normalize/default/JS/k-5/cibm-legislature-54.json'
  }else{
    path = '../../data/graph-json/standard/default/JS/k-5/cibm-legislature-54.json'
  }

  console.log('Selecting: '+checkedRadio+'ts.json')
  var jsonPromise = d3.json(path+'/'+checkedRadio)
  jsonPromise.then(function(graph) {
    window.graph = graph;
    updateSVG();
  })
}

// ============================================================================
// ON LOAD
// ===========================================================================

window.onload = function() {
  var jsonPromise = d3.json('../../data/graph-json/standard/default/JS/k-5/cibm-legislature-54.json')
  jsonPromise.then(function(graph){
    window.graph = graph;

    buildOptions(this.subquota, 'subquota-fieldset', 'subquota-group', 'radio', changeDataset);

    updateSVG();
  })
}