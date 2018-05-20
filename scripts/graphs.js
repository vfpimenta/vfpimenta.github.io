var Graph = {
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
        .attr("id", d=>d.id)
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
        .attr("style", "stroke: black; stroke-width: 0.5px;")
      }
    })
  },

  // ==========================================================================
  // INPUT & INTERACTIVITY
  // ==========================================================================

  changeDataset: function() {
    var checkedRadio = getCheckedOptions('subquota-group')[0]
    console.log(checkedRadio)
    switch(checkedRadio){
      case 'Flight ticket issue':
        window.seriesType = 'flight';
        break;
      case 'Publicity of parliamentary activity':
        window.seriesType = 'publicity';
        break;
      case 'Telecommunication':
        window.seriesType = 'telecom';
        break;
      case 'Maintenance of office supporting parliamentary activity':
        window.seriesType = 'maintenance';
        break;
      case 'Consultancy, research and technical work':
        window.seriesType = 'consultancy';
        break;
      case 'Fuels and lubricants':
        window.seriesType = 'fuels';
        break;
      case 'Automotive vehicle renting or watercraft charter':
        window.seriesType = 'auto-watercraft';
        break;
      case 'Automotive vehicle renting or charter':
        window.seriesType = 'auto';
        break;
      case 'Postal services':
        window.seriesType = 'postal';
        break;
      case 'Flight tickets':
        window.seriesType = 'flight-ticket';
        break;
      case 'Lodging, except for congressperson from Distrito Federal':
        window.seriesType = 'lodging';
        break;
      case 'Congressperson meal':
        window.seriesType = 'meal';
        break;
      case 'Aircraft renting or charter of aircraft':
        window.seriesType = 'aircraft';
        break;
      case 'Security service provided by specialized company':
        window.seriesType = 'security';
        break;
      case 'Locomotion, meal and lodging':
        window.seriesType = 'locomotion';
        break;
      case 'Taxi, toll and parking':
        window.seriesType = 'taxi';
        break;
      case 'Publication subscriptions':
        window.seriesType = 'publication';
        break;
      case 'Software purchase or renting; Postal services; Subscriptions':
        window.seriesType = 'software';
        break;
      case 'Purchase of office supplies':
        window.seriesType = 'office';
        break;
      case 'Watercraft renting or charter':
        window.seriesType = 'watercraft';
        break;
      case 'Terrestrial, maritime and fluvial tickets':
        window.seriesType = 'maritme';
        break;
      case 'Participation in course, talk or similar event':
        window.seriesType = 'course';
        break;
      default:
        window.seriesType = 'default'
        break;
    }

    Graph.loadOptions()
  },

  changeK: function() {
    var checkedRadio = getCheckedOptions('opt-k')[0]
    window.k = checkedRadio

    Graph.loadOptions()
  },

  changeDistance: function() {
    var checkedRadio = getCheckedOptions('opt-distance')[0]
    window.distanceMethod = checkedRadio

    Graph.loadOptions()
  },

  changeLegislature: function(cod) {
    window.legislature = cod;

    Graph.loadOptions()
  },

  loadOptions: function() {
    var path = '../../data/graph-json/'+window.mode+'/'+window.seriesType+'/'+window.distanceMethod+'/k-'+window.k+'/cibm-legislature-'+window.legislature+'.json'

    console.log('Selecting: '+path)
    d3.json(path).then(function(graph) {
      window.graph = graph;
      Graph.updateSVG();
    })
  },

  highlightNodes: function() {
    // TODO
  },

  init: function() {
    // Constant definition
    window.mode = 'standard';
    window.seriesType = 'default';
    window.distanceMethod = 'JS';
    window.k = 5;
    window.legislature = 54;

    d3.json('../../data/graph-json/standard/default/JS/k-5/cibm-legislature-54.json').then(function(json){
      window.graph = json;

      Graph.updateSVG();
    })
  }
};