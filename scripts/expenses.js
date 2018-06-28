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

function updateHistogramSVG(){
  var svg = d3.select("#expense-hist-svg")
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

  var groupY = d3.select("#expense-hist-svg").append("g")
  .call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
  var groupX = d3.select("#expense-hist-svg").append("g")
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
  .attr("class", d=>d.name.replace(/\,/g, ''))
  .attr("stroke-width", 1)
  .attr("stroke", "black")
  .attr("fill", d=>color(d.name))
  .attr("fill-opacity", 0.8)
  .attr("width", xScaleData.bandwidth())
  .attr("x", function(d){return d3.select(this.parentNode).attr("x")})
  .on("mouseover", function() {
    d3.selectAll("."+d3.select(this).attr("class"))
    .attr("fill-opacity", 1)
    .attr("stroke", "red")
    .raise()
  })
  .on("mouseout", function() {
    d3.selectAll("."+d3.select(this).attr("class"))
    .attr("fill-opacity", 0.8)
    .attr("stroke", "black")
    .raise()
  })
  .append('title').text(d=>d.name)

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
  .attr("fill-opacity", 0.8)
  .on("mouseover", function(d) {
    d3.selectAll("."+d.replace(/\,/g, ''))
    .attr("fill-opacity", 1)
    .attr("stroke", "red")
    .raise()

    d3.select(this).attr("fill-opacity", 1)
  })
  .on("mouseout", function(d) {
    d3.selectAll("."+d.replace(/\,/g, ''))
    .attr("fill-opacity", 0.8)
    .attr("stroke", "black")
    .raise()

    d3.select(this).attr("fill-opacity", 0.8)
  })

  legend.append("text")
  .attr("x", +svg.attr("width")-21)
  .attr("y", 4.5)
  .attr("dy", "0.32em")
  .text(d=>d)

  document.getElementById("loader1").setAttribute("style", "display: none;")
  document.getElementById("expense-hist-svg").setAttribute("style", "display: auto;")
};

function updateDonnutSVG() {
  // Build data
  var singleType = ''
  if (window.resolutionType == 'states') singleType = 'state'
  else if (window.resolutionType == 'parties') singleType = 'party'

  var objectData = {}
  switch(window.resolutionType){
    case 'states':
    case 'parties':
      window.generalData.map(function(d, i) {
        d[Object.keys(d)[0]].map(function(v, j) {
          if (objectData[v[singleType]]) {
            objectData[v[singleType]] += v.expense
          } else {
            objectData[v[singleType]] = v.expense
          }
        })
      })
      objectData = Object.keys(objectData).map(function(d, i) {
        return {
          key: d,
          value: objectData[d]
        }
      })
      break;
    case 'expenses':
      objectData = window.generalData.map(function(d, i) {
        return {
          key: Object.keys(d)[0],
          value: d[Object.keys(d)[0]].map(v=>v.expense).reduce((a,b)=>a+b)
        }
      })
      break;
  }

  // Plot data
  var svg = d3.select("#expense-donnut-svg")
  svg.selectAll("g").remove()

  var margin = {top: 20, right: 20, bottom: 20, left: 20};
  var width = svg.attr("width") - margin.left - margin.right;
  var height = svg.attr("height") - margin.top - margin.bottom;
  var canvas = svg.append("g");
  canvas.attr("transform", "translate(" + (width/2) + "," + (height/2) + ")")

  var donutWidth = 75;
  var radius = Math.min(width, height)/2;
  var color = getColor(window.resolutionType);

  var arc = d3.arc()
  .innerRadius(radius - donutWidth)
  .outerRadius(radius);

  var pie = d3.pie()
  .value(function(d) { return d.value; })
  .sort(null);

  var path = canvas.selectAll('g').data(pie(objectData)).enter().append('path')
  .attr('d', arc)
  .attr("stroke-width", 1)
  .attr("stroke", "black")
  .attr("class", d=>"p"+d.data.key.replace(/\,/g, ''))
  .attr('fill', function(d, i) { 
    return color(d.data.key);
  })
  .attr("fill-opacity", 0.8)
  .on("mouseover", function() {
    d3.select(this)
    .attr("fill-opacity", 1)
    .attr("stroke-width", 2)
    .attr("stroke", "red")
    .raise()
  })
  .on("mouseout", function() {
    d3.select(this)
    .attr("fill-opacity", 0.8)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
  })
  .append('title').text(function(d){
    var pct = Math.round(d.data.value/objectData.map(v=>v.value).reduce((a,b)=>a+b)*100)
    return d.data.key+"\n"+pct+"%"
  })

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
  .attr("fill-opacity", 0.8)
  .on("mouseover", function(d) {
    d3.selectAll(".p"+d.replace(/\,/g, ''))
    .attr("fill-opacity", 1)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .raise()

    d3.select(this).attr("fill-opacity", 1)
  })
  .on("mouseout", function(d) {
    d3.selectAll(".p"+d.replace(/\,/g, ''))
    .attr("fill-opacity", 0.8)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .raise()

    d3.select(this).attr("fill-opacity", 0.8)
  })

  legend.append("text")
  .attr("x", +svg.attr("width")-21)
  .attr("y", 4.5)
  .attr("dy", "0.32em")
  .text(d=>d)

  document.getElementById("loader2").setAttribute("style", "display: none;")
  document.getElementById("expense-donnut-svg").setAttribute("style", "display: auto;")
}

function parseJson(rawData) {
  var parsed = []
  var ids = Object.keys(rawData)
  for (var i = 0; i < ids.length; i++) {
    idx = ids[i]
    parsed.push({
      id:           idx, 
      name:         rawData[idx][0],
      state:        rawData[idx][1],
      party:        rawData[idx][2],
      legislatures: rawData[idx][3],
      expenses:     rawData[idx][4]
    })
  }

  var legislature = getCheckedOptions('opt-legislature')
  return d3.json('../../data/congressman_'+legislature+'_outliers.json').then(function(json){
    return parsed.filter(function(entry) {
      return !json.includes(entry.id) && entry.legislatures[legislature-53];
    });
  });
};

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

function changeType(groupName) {
  window.resolutionType = getCheckedOptions(groupName)[0]

  window.stateFilters = []
  window.partyFilters = []
  window.expenseFilters = []
  window.congressmanFilters = []
  var names = ['party', 'state', 'subquota'];
  for (var i = 0; i < names.length; i++) {
    var name = names[i];document.getElementsByName(name+'-group').forEach(function(box) {box.checked = false;})
  }

  updateHistogramSVG();
  updateDonnutSVG();
}

function filterData(name) {
  var filterList = getCheckedOptions(name+'-group')
  switch(name){
    case 'party':
      window.partyFilters = filterList;
      break;
    case 'state':
      window.stateFilters = filterList;
      break;
    case 'subquota':
      window.expenseFilters = filterList;
      break;
    case 'congressman':
      window.congressmanFilters = filterList;
      break;
  }

  buildData();
}

function buildData(){
  window.condensedData = []
  window.generalData = []
  var filePath = "../../data/time-series-json/standard";
  var seedCount = 0
  expenseFileSeeds.forEach(function(seed) {
    var fileName = "congressman_"+seed+"_ts.json";
    d3.json(filePath+'/'+fileName).then(function(seedJson){
      parseJson(seedJson).then(function(seedResult) {
        if(window.expenseFilters.length == 0 || window.expenseFilters.includes(seed)){
          var seedData = seedResult.reduce(function(a, b){
            return b.expenses.map(function(v, i){
              var inc = 0
              if ((window.stateFilters.length == 0 || window.stateFilters.includes(b.state)) && (window.partyFilters.length == 0 || window.partyFilters.includes(b.party)) && (window.congressmanFilters.length == 0 || window.congressmanFilters.includes(b.id))){
                inc = v
              }

              var tmpState = {}
              var tmpParty = {}
              var tmpExpenses = {}
              var tmpRaw = 0
              if (a.length == 0) {
                tmpState[b.state] = inc
                tmpParty[b.party] = inc
                tmpExpenses[seed] = inc
              } else {
                tmpState = a[i].states
                tmpState[b.state] = (tmpState[b.state] || 0) + inc
                tmpParty = a[i].parties
                tmpParty[b.party] = (tmpParty[b.party] || 0) + inc
                tmpExpenses = a[i].expenses
                tmpExpenses[seed] = (tmpExpenses[seed] || 0) + inc

                tmpRaw = a[i].raw 
              }

              return {
                raw: tmpRaw + inc,
                states: tmpState,
                parties: tmpParty,
                expenses: tmpExpenses
              }
            });
          }, []);

          if(window.condensedData && window.condensedData.length > 0){
            window.condensedData = window.condensedData.map(function(d, i) {
              return {
                raw: d.raw + seedData[i].raw,
                states: d.states.merge(seedData[i].states, (a,b)=>a+b),
                parties: d.parties.merge(seedData[i].parties, (a,b)=>a+b),
                expenses: d.expenses.merge(seedData[i].expenses, (a,b)=>a+b)
              }
            })
          }else{
            window.condensedData = seedData
          }

          var tmpObj = {}
          tmpObj[seed] = seedResult
          .filter(function(v, i) {
            return (window.stateFilters.length == 0 || window.stateFilters.includes(v.state)) && (window.partyFilters.length == 0 || window.partyFilters.includes(v.party)) && (window.congressmanFilters.length == 0 || window.congressmanFilters.includes(v.id));
          })
          .map(function(v, i) {
            return {
              id: v.id,
              state: v.state,
              party: v.party,
              expense: v.expenses.reduce((a,b)=>a+b)
            }
          })

          window.generalData.push(tmpObj)
        }

        seedCount++
        // Wait for all callbacks to finish
        if(seedCount == 22){

          if(!window.optionsState){
            buildOptions(Object.keys(window.condensedData[window.sections.start].states).map(function(d){return {id: d, name: d}}), 'state-fieldset', 'state-group', 'checkbox', function(){filterData('state')});

            buildOptions(Object.keys(window.condensedData[window.sections.start].parties).map(function(d){return {id: d, name: d}}), 'party-fieldset', 'party-group', 'checkbox', function(){filterData('party')});

            buildOptions(Object.keys(window.condensedData[window.sections.start].expenses).map(function(d){return {id: d, name: d}}), 'subquota-fieldset', 'subquota-group', 'checkbox', function(){filterData('subquota')});

            window.optionsState = true;
          }

          updateHistogramSVG();
          updateDonnutSVG();
        }
      });
    });
  });

  d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
    parseJson(json).then(function(result) {
      var congressmanData = result;

      buildOptions(congressmanData, 'congressman-fieldset', 'congressman-group', 'checkbox', function() {filterData('congressman')});
    });
  });
}

window.onload = function() {
  window.resolutionType = 'states'
  window.stateFilters = []
  window.partyFilters = []
  window.expenseFilters = []
  window.congressmanFilters = []
  window.sections = {start: 22, end: 70}
  window.generalData = []
  window.optionsState = false

  buildData();
};

Object.prototype.merge = function(other, op) {
  aux = this; obj = {};
  Object.keys(aux).forEach(function(key) {
    obj[key] = op((aux[key]||0), (other[key]||0))
  })
  Object.keys(other).forEach(function(key) {
    obj[key] = op((aux[key]||0), (other[key]||0))
  })
  return obj;
};

// Cluster id helper function
function checkCongressman(list) {
  document.getElementsByName('congressman-group').forEach(function(entry) {
    if(list.includes(entry.id)){
      entry.checked = true
    }
  });

  filterData('congressman');
}