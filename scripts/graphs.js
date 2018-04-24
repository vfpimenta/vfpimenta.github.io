window.onload = function() {
  var svg = d3.select("svg")
  var width = +d3.select("svg").attr("width")
  var height = +d3.select("svg").attr("height")
  var radius = 5

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().distanceMax(80))
    .force("center", d3.forceCenter(width / 2, height / 2));

  var jsonPromise = d3.json('../../data/cibm-base.json')
  jsonPromise.then(function(graph){
    var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("style", "stroke: #999; stroke-opacity: 0.6;");

    var node = svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
        .attr("r", function(d){
          var lScale = d3.scaleLog()
          .domain(d3.extent(graph.nodes.map(d=>d.size)))
          .range([0, 3]);

          return 3+lScale(d.size);
        })
        .attr("fill", function(d) { return color(d.group); })
        .attr("style", "stroke: #fff; stroke-width: 1.5px;")
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

    simulation
        .nodes(graph.nodes)
        .on("tick", function() {
          link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

          node
            .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
        });

    simulation.force("link")
        .links(graph.links);
  })
}