var Graph = {
  // ==========================================================================
  // OPTIONS
  // ==========================================================================

  buildOptions: function(dataset, parentFieldset, groupName, type, eventListener){
    var fieldset = document.getElementById(parentFieldset)

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
      var checkbox = Graph.createNewBox(groupName, dataset[i].id, type)
      Graph.addListener(checkbox, 'click', eventListener)

      var span = document.createElement('span')
      span.innerHTML = dataset[i].name

      fieldset.appendChild(checkbox)
      fieldset.appendChild(span)
      fieldset.appendChild(document.createElement('br'))
    }
  },

  createNewBox: function(name, id, type){
      var checkbox = document.createElement('input'); 
      checkbox.type = type;
      checkbox.name = name;
      checkbox.id = id;
      return checkbox;
  },

  addListener: function(element, eventName, handler) {
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, false);
    }
    else if (element.attachEvent) {
      element.attachEvent('on' + eventName, handler);
    }
    else {
      element['on' + eventName] = handler;
    }
  },

  getCheckedOptions: function(groupName) {
    var checked = []
    var congressmanBoxes = document.getElementsByName(groupName)
    for (var i = 0; i < congressmanBoxes.length; i++) {
      if(congressmanBoxes[i].checked){
        checked.push(congressmanBoxes[i].id)
      }
    }

    return checked
  },

  // ==========================================================================
  // D3 MAIN
  // ==========================================================================

  updateSVG: function(){
    d3.select("#graph-svg").selectAll("g").remove()

    var svg = d3.select("#graph-svg")
    var width = +d3.select("#graph-svg").attr("width")
    var height = +d3.select("#graph-svg").attr("height")
    var radius = 3

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d=>d.id).distance(10))
      .force("charge", d3.forceManyBody().strength(-0.1))
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulation
        .nodes(window.graph.nodes)
        .on("tick", function() {
          link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

          node
            .attr("cx", function(d) { return d.x = d.x; })
            .attr("cy", function(d) { return d.y = d.y; });
        });

    simulation.force("link")
        .links(window.graph.links);

    simulation.alphaDecay(1 - Math.pow(0.001, 1/3000));

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
        .attr("class", d=>"group-"+d.group)
        .attr("r", function(d){
          var lScale = d3.scaleLog()
          .domain(d3.extent(window.graph.nodes.map(d=>d.size)))
          .range([0, 3]);

          return radius;
        })
        .attr("fill", function(d) { return color(d.group); })
        .attr("style", "stroke: white; stroke-width: 0.5px;")
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

    node.on("click", function(d) {
      if(d3.select(this).attr("class").includes("selected")){
        d3.selectAll(".group-"+d.group)
        .attr("class", "group-"+d.group)
        .attr("r", radius)
        .attr("style", "stroke: white; stroke-width: 0.5px;")
      }else{
        d3.selectAll("circle")
        .attr("class", function() {
          return d3.select(this).attr("class").replace("selected", "");
        })
        .attr("r", radius)
        .attr("style", "stroke: white; stroke-width: 0.5px;")

        d3.selectAll(".group-"+d.group)
        .attr("class", "group-"+d.group+" selected")
        .attr("r", radius+1)
        .attr("style", "stroke: black; stroke-width: 1.5px;")
      }
    })
  },

  // ==========================================================================
  // INPUT & INTERACTIVITY
  // ==========================================================================

  parseCsv: function(raw_data) {
    var parsed = []
    for (var i = 0; i < raw_data.length; i++) {
      parsed.push({
        id:   raw_data[i].Subquota, 
        name:   raw_data[i].Subquota
      })
    }
    return parsed
  },

  changeDataset: function() {
    var checkedRadio = Graph.Graph.getCheckedOptions('subquota-group')[0]
    console.log(checkedRadio)
    switch(checkedRadio){
      case 'Flight ticket issue':
        window.seriesType = 'flight'
        break;
      case 'Publicity of parliamentary activity':
        window.seriesType = 'publicity'
        break;
      case 'Telecommunication':
        window.seriesType = 'telecom'
        break;
      case 'Fuels and lubricants':
        window.seriesType = 'fuels'
        break;
      default:
        window.seriesType = 'default'
        break;
    }

    Graph.loadOptions()
  },

  changeK: function() {
    var checkedRadio = Graph.getCheckedOptions('opt-k')[0]
    window.k = checkedRadio

    Graph.loadOptions()
  },

  changeDistance: function() {
    var checkedRadio = Graph.getCheckedOptions('opt-distance')[0]
    window.distanceMethod = checkedRadio

    Graph.loadOptions()
  },

  changeLegislature: function() {
    var checkedRadio = Graph.getCheckedOptions('opt-legislature')[0]
    window.legislature = checkedRadio

    Graph.loadOptions()
  },

  loadOptions: function() {
    var path = '../../data/graph-json/'+window.mode+'/'+window.seriesType+'/'+window.distanceMethod+'/k-'+window.k+'/cibm-legislature-'+window.legislature+'.json'

    console.log('Selecting: '+path)
    var jsonPromise = d3.json(path)
    jsonPromise.then(function(graph) {
      window.graph = graph;
      Graph.updateSVG();
    })
  },

  // ==========================================================================
  // ON LOAD
  // =========================================================================

  main: function() {
    console.log('started graph script')

    // Constant definition
    window.mode = 'standard';
    window.seriesType = 'default';
    window.distanceMethod = 'JS';
    window.k = 5;
    window.legislature = 54;

    var jsonPromise = d3.json('../../data/graph-json/standard/default/JS/k-5/cibm-legislature-54.json')
    jsonPromise.then(function(graph){
      window.graph = graph;

      var csvPromisse = d3.csv('../../data/subquota.csv')
      csvPromisse.then(function(csv) {
        this.subquota = Graph.parseCsv(csv)

        Graph.buildOptions(this.subquota, 'subquota-fieldset', 'subquota-group', 'radio', Graph.changeDataset);

        Graph.updateSVG();
      })
    })
  }
};