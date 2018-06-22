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
    Array.from(new Set(this.graph.nodes.map(d=>d.group))).sort((a,b)=>a-b).forEach(function(entry) {
      color(entry)
    })

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d=>d.id).distance(10))
      .force("charge", d3.forceManyBody().strength(-0.1))
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulation
        .nodes(this.graph.nodes)
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
        .links(this.graph.links);

    simulation.alphaDecay(1 - Math.pow(0.001, 1/3000));

    var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(this.graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("style", "stroke: #999; stroke-opacity: 0.6;");

    var node = svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(this.graph.nodes)
      .enter().append("circle")
        .attr("class", d=>"group-"+d.group)
        .attr("r", function(d){
          var lScale = d3.scaleLog()
          .domain(d3.extent(Graph.graph.nodes.map(d=>d.size)))
          .range([0, 3]);

          return radius;
        })
        .attr("fill", function(d) { return color(d.group); })
        .attr("style", "stroke: white; stroke-width: 0.5px;")
        .attr("id", d=>"c"+d.congressman_id)
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
      if (d3.select(this).attr("class").includes("selected")) {
        TimeSeries.selectedOptions = [];
        TimeSeries.selectedAttribute = 'id';
        d3.selectAll(".group-"+d.group).each(function(entry) {
          document.getElementById(entry.congressman_id).checked = false;
        })

        d3.selectAll(".group-"+d.group)
        .attr("class", "group-"+d.group)
        .attr("r", radius)
        .attr("style", "stroke: white; stroke-width: 0.5px;")

        fillSummary();      
      } else {
        TimeSeries.selectedOptions = [];
        TimeSeries.selectedAttribute = 'id';
        Array.from(document.getElementsByName("congressman-group")).forEach(function(entry) {
          return entry.checked = false;
        });
        d3.selectAll(".group-"+d.group).each(function(entry,) {
          document.getElementById(entry.congressman_id).checked = true;
        })

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
        .each(function(entry) {
          TimeSeries.selectedOptions.push(entry.congressman_id)
        })

        var nodes = [];
        d3.selectAll(".group-"+d.group).each(function(entry) {
          nodes.push(entry)
        })

        fillSummary(nodes);
      }
      console.log(TimeSeries.selectedOptions)
      TimeSeries.updateSVG();
    });
  },

  // ==========================================================================
  // INPUT & INTERACTIVITY
  // ==========================================================================

  changeDataset: function() {
    var checkedRadio = getCheckedOptions('subquota-group')[0]
    if (checkedRadio == 'NONE') {
      this.seriesType = 'default'
      Graph.loadOptions()
    } else {
      d3.csv('../../data/subquota.csv').then(function(csv) {
        for (var i = 0; i < csv.length; i++) {
          if(checkedRadio == csv[i].Subquota){
            Graph.seriesType = csv[i].Shortname
          }
        }

        Graph.loadOptions()    
      });
    }
  },

  changeK: function() {
    var checkedRadio = getCheckedOptions('opt-k')[0]
    this.k = checkedRadio

    Graph.loadOptions()
  },

  changeDistance: function() {
    var checkedRadio = getCheckedOptions('opt-distance')[0]
    this.distanceMethod = checkedRadio

    Graph.loadOptions()
  },

  changeLegislature: function(cod) {
    this.legislature = cod;

    Graph.loadOptions()
  },

  loadOptions: function() {
    var path = '../../data/graph-json/'+this.mode+'/'+this.seriesType+'/'+this.distanceMethod+'/k-'+this.k+'/cibm-legislature-'+this.legislature+'.json'

    console.log('Selecting: '+path)
    d3.json(path).then(function(graph) {
      Graph.graph = graph;
      Graph.updateSVG();
    }).catch(Graph.errorHandler)
  },

  highlightNodes: function(groupName, attribute) {
    selectedOptions = getCheckedOptions(groupName);

    d3.selectAll("circle")
    .attr("class", function() {
      return d3.select(this).attr("class").replace("selected", "");
    })
    .attr("r", 3)
    .attr("style", "stroke: white; stroke-width: 0.5px;")

    
    d3.selectAll('circle')
    .attr("class", function(d, i) {
      if(selectedOptions.includes(d[attribute])){
        return d3.select(this).attr("class").concat(" selected");  
      }else{
        return d3.select(this).attr("class");  
      }
    })
    .attr("r", function(d, i) {
      if(selectedOptions.includes(d[attribute])){
        return parseInt(d3.select(this).attr("r"))+1;
      }else{
        return d3.select(this).attr("r");
      }
    })
    .attr("style", function(d, i) {
      if(selectedOptions.includes(d[attribute])){
        return "stroke: black; stroke-width: 0.5px;"
      }else{
        return d3.select(this).attr("style"); 
      }
    })
    
  },

  errorHandler: function() {
    alert('No graph data found for expense \''+this.seriesType+'\', distance \''+this.distanceMethod+'\', k '+this.k+" and legislature "+this.legislature);
  },

  init: function() {
    // Constant definition
    this.mode = 'standard';
    this.seriesType = 'default';
    this.distanceMethod = 'JS';
    this.k = 5;
    this.legislature = 54;

    d3.json('../../data/graph-json/standard/default/JS/k-5/cibm-legislature-54.json').then(function(json){
      Graph.graph = json;

      Graph.updateSVG();
    }).catch(this.errorHandler)
  }
};