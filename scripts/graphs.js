window.onload = function() {
  var svg = d3.select("svg")
  var width = +d3.select("svg").attr("width")
  var height = +d3.select("svg").attr("height")
  var radius = 5

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().distanceMax(60))
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

    var nGroups = [...new Set(graph.nodes.map(n=>n.group))].length
    var groupScaleX = scaleAngle('x', nGroups, 0.3)
    var groupScaleY = scaleAngle('y', nGroups, 0.3)

    simulation
        .nodes(graph.nodes)
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
        .links(graph.links);
  })
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