function calculateAvg(dataset){
	var avgArray = []

	for (var i = 0; i < dataset.length; i++) {
		avgArray.push(dataset[i].expenses)
	}

	return math.mean(avgArray, 0)
}

function getDate(index) {
	
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
	// Mean
	canvas.selectAll("g").data(avgData).enter().append("line")
	.attr("x1", (d,i)=>xScale(getDate(i))-1)
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
	    return yScale(temperature.DailyMean[i+1])
	  } else {
	    return yScale(d)
	  }
	})
	.attr("stroke","black").attr("stroke-width",2)
}

window.onload = function() {
  main()
};