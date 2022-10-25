fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json")
   .then((response) => response.json())
   .then((data) => {
    data.monthlyVariance.forEach((val) => {val.month -= 1;});
    drawData(data);
    window.addEventListener("resize", () => drawData(data), false);
 });

function drawData(data) {
  //data.monthlyVariance[0].year/.month/.variance
  //data.baseTemperature  
  const chartDiv = document.getElementById("chart");
  chartDiv.textContent = "";
  const padding = 50;
  const chartWidth = chartDiv.offsetWidth - padding;
  const chartHeight = chartDiv.offsetHeight - padding;
  let rightSpace = 15;
  if (chartWidth <= 500) rightSpace = 10;

  const div = d3.select("#chart");
  div
    .append("h1")
    .attr("id", "title")
    .text("Monthly Global Land-Surface Temperature")
    .append("h5")
    .attr("id", "description")
    .text("1753 - 2015: base temperature 8.66℃");

  div.append("div").attr("id", "tooltip");
  
  const toolTip = d3.select("#tooltip");
  toolTip.style("opacity", 0);

  const svg = d3.select("#chart").append("svg");

  svg
    .append("text")
    .classed("axis-titles", true)
    .attr("transform", "rotate(-90)")
    .attr("y", padding/2)
    .attr("x", -chartHeight / 2)
    .text("Months");

  svg
    .append("text")
    .classed("axis-titles", true)
    .attr("x", () => {
          if (window.innerWidth < 550) return 220 + (chartWidth-220) / 2;
          return padding + chartWidth / 2;
        })
    .attr("y", chartHeight - padding / 4)
    .text("Years");
  
  const months = (m) => {
      const date = new Date(0);
      date.setUTCMonth(m);
      const format = d3.timeFormat('%B');
      return format(date);
  }

  
  // yaxis
  const yScale = d3
    .scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .rangeRound([2*padding, chartHeight]);

  const yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickValues(yScale.domain())
    .tickFormat((month) => {
      return months(month);
    });

  svg
    .append('g')
    .classed('y-axis', true)
    .attr('id', 'y-axis')
    .attr('transform', 'translate(' + 2*padding + ',' + -padding + ')')
    .call(yAxis);

  // xaxis
  const xScale = d3
    .scaleBand()
    .domain(data.monthlyVariance.map((val) => {return val.year}))
    .range([padding, chartWidth-padding-15]);

  const xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickValues(
      xScale.domain().filter((year) => {
        if (window.innerWidth < 550) return year % 40 === 0;
        if (window.innerWidth < 1000) return year % 20 === 0;
        return year % 10 === 0;
      })
    )
    .tickFormat((year) => {
      const date = new Date(0);
      date.setUTCFullYear(year);
      const format = d3.timeFormat('%Y');
      return format(date);
    });

  svg
    .append('g')
    .classed('x-axis', true)
    .attr('id', 'x-axis')
    .attr('transform', 'translate(' + padding + ',' + (chartHeight - padding) + ')')
    .call(xAxis);
  
  const variances = data.monthlyVariance.map((el) => el.variance);
  const minVariance = d3.min(variances);
  const maxVariance = d3.max(variances);  
  let myColor = d3.scaleSequential()
    .domain([minVariance+1, maxVariance-.5])
    .interpolator(d3.interpolatePlasma);
  
  svg
    .append('g')
    .attr('transform', 'translate(' + padding + ',' + -padding + ')')
    .selectAll('rect')
    .data(data.monthlyVariance)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-month', (d) => {return d.month;})
    .attr('data-year', (d) => {return d.year;})
    .attr('data-temp', (d) => {return data.baseTemperature + d.variance;})
    .attr('x', (d) => xScale(d.year))
    .attr('y', (d) => yScale(d.month))
    .attr('width', (d) => xScale.bandwidth(d.year)+.25)
    .attr('height', (d) => yScale.bandwidth(d.month)+.25)
    .attr('fill', (d) => {return myColor(d.variance)})
    .attr('filter', 'brightness(1.5)')
    .attr('opacity', '.8')
    .on("mouseover", (event, d) => {
      toolTip.html(
          months(d.month) +', ' + d.year + '<br>Temp.: ' + (data.baseTemperature + d.variance).toFixed(2) + '℃'
      );
      let tooltipWidth = document.getElementById("tooltip").offsetWidth;
      let tooltipHeight = document.getElementById("tooltip").offsetHeight;
      toolTip
        .style("opacity", 1)
        .style("left", xScale(d.year) - tooltipWidth / 2 + padding / 2 + "px")
        .style("top", yScale(d.month) - tooltipHeight + padding / 2 + "px")
        .attr("data-year", d.year);
    })
    .on("mouseout", (event, d) => toolTip.style("opacity", 0));
  
  
  //legend
  const minLegend = Math.round(data.baseTemperature + minVariance);
  const maxLegend = Math.round(data.baseTemperature + maxVariance);
  const domainLegend = [];
  for (let i = minLegend; i <= maxLegend; i++)  domainLegend.push(i);
  const xScaleLegend = d3
    .scaleBand()
    .domain(domainLegend)
    .range([0, 195]);

  const xAxisLegend = d3
    .axisBottom()
    .scale(xScaleLegend)
    .tickValues(xScaleLegend.domain());

  svg
    .append('g')
    .attr('id', 'legend')
    .attr('transform', 'translate(' + 25 + ',' + (chartHeight - 13) + ')')
    .call(xAxisLegend)
    .append('g')
    .selectAll('rect')
    .data(domainLegend)
    .enter()
    .append('rect')
    .style('fill', (d) => {return myColor(d - data.baseTemperature)})
    .attr('filter', 'brightness(1.5)')
    .attr('opacity', '.8')
    .attr('x', (d) => ((d-2)*15))
    .attr('y', -15)
    .attr('width', '15px')
    .attr('height', '15px');
  
}
