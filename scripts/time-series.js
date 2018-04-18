function calculateAvg(dataset){
	var avgArray = []

	for (var i = 0; i < dataset.length; i++) {
		avgArray.push(dataset[i].expenses)
	}

	return math.mean(avgArray, 0)
}

function getDate(index) {
	var month = index % 12 + 4
	var year = 2009 + Math.trunc(index / 12)
	return new Date(year, month, 1)
}

function main(){
	var margin = {top: 5, right: 5, bottom: 20, left: 55};
	var width = d3.select("svg").attr("width") - margin.left - margin.right;
	var height = d3.select("svg").attr("height") - margin.top - margin.bottom;

	var canvas = d3.select("svg").append("g");
	canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

	// Data parsing
	var avgData = calculateAvg(congressman_ts)

	// Axes plotting
	var yScale = d3.scaleLinear()
	.domain(d3.extent(avgData)).range([height,0]);
	var xScale = d3.scaleTime()
	.domain([new Date(2009, 4, 1), new Date(2016, 8, 1)]).range([0, width])

	var yAxis = d3.axisLeft(yScale);
	var xAxis = d3.axisBottom(xScale)

	var groupY = d3.select("svg").append("g")
	.call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
	var groupY = d3.select("svg").append("g")
	.call(xAxis).attr("transform","translate("+margin.left+","+height+")")

	// Lines plotting
	canvas.selectAll("g").data(avgData).enter().append("line")
	.attr("x1", (d,i)=>xScale(getDate(i)))
	.attr("x2", function(d, i){
	  if (avgData[i+1]){
	    return xScale(getDate(i+1))
	  } else {
	    return xScale(getDate(i))
	  }
	})
	.attr("y1", d=>yScale(d))
	.attr("y2", function(d, i){
	  if (avgData[i+1]){
	    return yScale(avgData[i+1])
	  } else {
	    return yScale(d)
	  }
	})
	.attr("stroke","black").attr("stroke-width",2)

	// Crosshair
	var transpRect = canvas.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white")
    .attr("opacity", 0);

    var verticalLine = canvas.append("line")
    .attr("opacity", 0)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none")
    .style("stroke-dasharray", ("3, 3"));

	var horizontalLine = canvas.append("line")
    .attr("opacity", 0)
    .attr("x1", 0)
    .attr("x2", width)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none")
    .style("stroke-dasharray", ("3, 3"));

    transpRect.on("mousemove", function(){  
	    mouse = d3.mouse(this);
	    mousex = mouse[0];
	    mousey = mouse[1];
	    verticalLine.attr("x1", mousex).attr("x2", mousex).attr("opacity", 1);
	    horizontalLine.attr("y1", mousey).attr("y2", mousey).attr("opacity", 1)
	}).on("mouseout", function(){  
	    verticalLine.attr("opacity", 0);
	    horizontalLine.attr("opacity", 0);
	});
}

window.onload = function() {
  main()
};