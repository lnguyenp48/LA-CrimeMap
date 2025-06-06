import { getLocationCounts } from './main.js';

// dataset: filtered data set
export async function drawBarChart(dataset, district = "all") {
    const locationCounts = await getLocationCounts(dataset, district); 
  
    const locationData = Object.entries(locationCounts).map(([type, count]) => ({ type, count }));
  
    const margin = { top: 30, right: 20, bottom: 60, left: 80 },
          width = 350 - margin.left - margin.right,
          height = 700 - margin.top - margin.bottom;
  
    d3.select("#locationBarChart").selectAll("*").remove();
  
    const svg = d3.select("#locationBarChart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10) 
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-family", "sans-serif")
      .text("Number of Crimes at Different Locations");
    // X axis
    const x = d3.scaleBand()
      .domain(locationData.map(d => d.type))
      .range([0, width])
      .padding(0.2);
  
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end");
  
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(locationData, d => d.count)])
      .range([height, 0]);
  
    svg.append("g")
      .call(d3.axisLeft(y));
  
    // Bars
    svg.selectAll("rect")
      .data(locationData)
      .join("rect")
      .attr("x", d => x(d.type))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count))
      .attr("fill", "#c7615a");
  
    // Labels
    svg.selectAll("text.bar")
      .data(locationData)
      .join("text")
      .attr("class", "bar")
      .attr("text-anchor", "middle")
      .attr("x", d => x(d.type) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5);
  }