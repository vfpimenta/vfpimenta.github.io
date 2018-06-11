const expenseFileSeeds = [
  "aircraft-renting-or-charter-of-aircraft",
  "automotive-vehicle-renting-or-charter",
  "automotive-vehicle-renting-or-watercraft-charter",
  "congressperson-meal",
  "consultancy,-research-and-technical-work",
  "flight-ticket-issue",
  "flight-tickets",
  "fuels-and-lubricants",
  "locomotion,-meal-and-lodging",
  "lodging,-except-for-congressperson-from-distrito-federal",
  "maintenance-of-office-supporting-parliamentary-activity",
  "participation-in-course,-talk-or-similar-event",
  "postal-services",
  "publication-subscriptions",
  "publicity-of-parliamentary-activity",
  "purchase-of-office-supplies",
  "security-service-provided-by-specialized-company",
  "software-purchase-or-renting;-postal-services;-subscriptions",
  "taxi,-toll-and-parking",
  "telecommunication",
  "terrestrial,-maritime-and-fluvial-tickets",
  "watercraft-renting-or-charter",
]

// ==========================================================================
// D3 MAIN
// ==========================================================================

function getDate(index) {
  var month = index % 12 + 3
  var year = 2009 + Math.trunc(index / 12)
  return new Date(year, month, 1)
};

function getColor(type) {
  switch(type){
    case 'states':
      return d3.scaleOrdinal()
      .domain(["PE", "DF", "CE", "PI", "RJ", "SP", "PR", "SC", "RS", "ES", "MG", "MT", "GO", "BA", "PA", "AC", "RN", "PB", "AL", "SE", "AM", "MS", "MA", "RO", "RR", "AP", "TO"])
      .range(["#3dbbb8", "#d44137", "#35933f", "#aa5ace", "#76bc46", "#6266d5", "#b3ac3f", "#ce4cad", "#61b882", "#d84187", "#5e7836", "#d78cdb", "#dc9736", "#4681ce", "#d26426", "#53a4d6", "#d74363", "#9c95df", "#90682c", "#64599d", "#cda46c", "#984580", "#e38069", "#ad71a8", "#a54934", "#e484a3", "#a2485e"]);
    case 'parties':
      return d3.scaleOrdinal()
      .domain(["PTdoB", "PSDB", "PSB", "PP", "PT", "PTB", "PRB", "PMDB", "PPS", "PSOL", "DEM", "PROS", "PV", "PR", "PSD", "PDT", "SD", "PCdoB", "PSC", "PHS", "REDE", "PMN", "PEN", "PTN", "PSL", "PMB", "PRP"])
      .range(["#858226", "#a050ce", "#5cc157", "#af3899", "#9bb735", "#5c65d3", "#d1b145", "#b27de4", "#468b3a", "#e169c9", "#50b695", "#d84380", "#a0b46c", "#89549c", "#d7892f", "#8197e0", "#d4512c", "#46aed7", "#ce424f", "#506e37", "#d089c2", "#927134", "#5366a7", "#e3966d", "#9a4363", "#a45631", "#dc7b88"]);
    case 'expenses':
      return d3.scaleOrdinal()
      .domain(["aircraft-renting-or-charter-of-aircraft", "participation-in-course,-talk-or-similar-event", "publication-subscriptions", "purchase-of-office-supplies", "software-purchase-or-renting;-postal-services;-subscriptions", "terrestrial,-maritime-and-fluvial-tickets", "watercraft-renting-or-charter", "flight-tickets", "locomotion,-meal-and-lodging", "lodging,-except-for-congressperson-from-distrito-federal", "automotive-vehicle-renting-or-charter", "security-service-provided-by-specialized-company", "taxi,-toll-and-parking", "consultancy,-research-and-technical-work", "automotive-vehicle-renting-or-watercraft-charter", "publicity-of-parliamentary-activity", "congressperson-meal", "maintenance-of-office-supporting-parliamentary-activity", "fuels-and-lubricants", "postal-services", "telecommunication", "flight-ticket-issue"])
      .range(["#88579e", "#6bb742", "#ac40af", "#51be80", "#7463d7", "#b9ac3d", "#d379df", "#5f762a", "#ce438d", "#3a865b", "#d9425d", "#4cc2bc", "#cf5032", "#53a0d5", "#db9234", "#5072c3", "#9cb169", "#a598de", "#97662e", "#dc85b4", "#e09071", "#a74f64"])
  }
}

function updateSVG(){
  var svg = d3.select("#expense-svg")
  svg.selectAll("g").remove()

  var margin = {top: 5, right: 70, bottom: 20, left: 65};
  var width = svg.attr("width") - margin.left - margin.right;
  var height = svg.attr("height") - margin.top - margin.bottom;
  var canvas = svg.append("g");
  canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var expenseDomain = [0, d3.extent(window.condensedData.map(d=>d.raw))[1]]
  var dateDomain = d3.range(window.sections.start, window.sections.end).map(d=>getDate(d))

  var color = getColor(window.resolutionType)

  // Axes plotting
  var xScaleData = d3.scaleBand()
  .domain(dateDomain).range([0, width])
  .paddingInner(0.05).align(0.1);
  var xScaleAxis = d3.scaleTime()
  .domain([getDate(window.sections.start), getDate(window.sections.end)]).range([0, width])
  var yScale = d3.scaleLinear()
  .domain(expenseDomain).range([height, 0]);

  var yAxis = d3.axisLeft(yScale);
  var xAxis = d3.axisBottom(xScaleAxis)

  var groupY = d3.select("#expense-svg").append("g")
  .call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
  var groupX = d3.select("#expense-svg").append("g")
  .call(xAxis).attr("transform","translate("+margin.left+","+height+")")

  // Bar plotting
  canvas.selectAll("g")
  .data(window.condensedData.slice(window.sections.start, window.sections.end))
  .enter().append("g")
  .attr("x",(d,i)=>xScaleData(getDate(i+window.sections.start)))
  .selectAll("rect").data(function(d){
    return Object.keys(d[window.resolutionType]).sort().map(function(v, i) {
      if(i > 0){
        return {current: d[window.resolutionType][v], sumPrevious: Object.keys(d[window.resolutionType]).sort().map(u=>d[window.resolutionType][u]).slice(0,i).reduce((a,b)=>a+b), name: v}
      } else {
        return {current: d[window.resolutionType][v], sumPrevious: 0, name: v}
      }
    })
  }).enter().append("rect")
  .attr("y", function(d) {
    return yScale(d.current+d.sumPrevious)-margin.top
  })
  .attr("height", function(d) {
    return height-yScale(d.current)
  })
  .attr("width", xScaleData.bandwidth())
  .attr("stroke-width", 1)
  .attr("stroke", "black")
  .attr("fill", d=>color(d.name))
  .attr("x", function(d){return d3.select(this.parentNode).attr("x")})

  // Legend plotting
  var legend = svg.append("g")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .attr("text-anchor", "end")
  .selectAll("g")
  .data(Object.keys(window.condensedData[window.sections.start][window.resolutionType]).sort().reverse()).enter().append("g")
  .attr("transform", function(d, i) {
    return "translate(0,"+i*11+")";
  })

  legend.append("rect")
  .attr("x", +svg.attr("width")-11)
  .attr("width", 10)
  .attr("height", 10)
  .attr("fill", d=>color(d))

  legend.append("text")
  .attr("x", +svg.attr("width")-21)
  .attr("y", 4.5)
  .attr("dy", "0.32em")
  .text(d=>d)
};

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

  var legislature = getCheckedOptions('opt-legislature')
  return d3.json('../../data/congressman_'+legislature+'_outliers.json').then(function(json){
    return parsed.filter(function(entry) {
      return !json.includes(entry.id) && entry.legislatures[legislature-53];
    });
  });
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

function changeType(groupName) {
  window.resolutionType = getCheckedOptions(groupName)[0]
  updateSVG();
}

window.onload = function() {
  var filePath = "../../data/time-series-json/standard";
  d3.json(filePath+'/congressman_ts.json').then(function(baseJson){
    parseJson(baseJson).then(function(baseResult) {
      window.resolutionType = 'states'
      window.sections = {start: 22, end: 70}
      window.condensedData = baseResult.reduce(function(a, b){
        return b.expenses.map(function(v, i){
          var tmpState = {}
          var tmpParty = {}
          var tmpRaw = 0
          if (a.length == 0) {
            tmpState[b.state] = v
            tmpParty[b.party] = v
          } else {
            tmpState = a[i].states
            tmpState[b.state] = (tmpState[b.state] || 0) + v
            tmpParty = a[i].parties
            tmpParty[b.party] = (tmpParty[b.party] || 0) + v

            tmpRaw = a[i].raw 
          }
          return {
            raw: tmpRaw + v,
            states: tmpState,
            parties: tmpParty
          }
        });
      }, []);

      var seedCount = 0
      expenseFileSeeds.forEach(function(seed) {
        var fileName = "congressman_"+seed+"_ts.json";
        d3.json(filePath+'/'+fileName).then(function(seedJson){
          parseJson(seedJson).then(function(seedResult) {
            window.condensedData = window.condensedData.map(function(v, i){
              var isum = seedResult.map(d=>d.expenses).reduce(function(a, b) {
                return a+b[i];
              }, 0)

              var tmpExpenses = {}
              if (v.expenses) {
                tmpExpenses = v.expenses
              }
              tmpExpenses[seed] = isum

              return {
                raw: v.raw,
                states: v.states,
                parties: v.parties,
                expenses: tmpExpenses
              }
            });

            seedCount++
            // Wait for all callbacks to finish
            if(seedCount == 22){
              updateSVG();
            }
          });
        });
      });
    });
  });
};