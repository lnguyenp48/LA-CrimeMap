/** REFERENCES
 *  1. ChatGPT for guidance and syntax help: knowing to get a geojson file, how to load it, etc
 *  2. https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/
 *  3. https://d3-graph-gallery.com/graph/interactivity_tooltip.html#position
 *  4. https://observablehq.com/@d3/zoom-to-bounding-box 
 *  5. https://observablehq.com/@davidnmora/d3-zoom-gentle-introduction 
 *  6. https://stackoverflow.com/questions/12068510/calculate-centroid-d3 
 *  7. https://github.com/via-teaching/ecs163-25s/tree/main/Homework2
**/
import { countCrimes } from './main.js';
import { drawBarChart } from './barCharts.js';

// This function essentially draws the whole heat map (boundaries, color hexagons, etc.)
export async function initMap(crimeData, fullData) {
    try {
        const [geoData, districtCrimeCounts] = await Promise.all([
            d3.json("data/lapd_districts.geojson"),
            countCrimes(crimeData)
        ]);
        console.log("Crime Data From Heat", districtCrimeCounts);

        // Create SVG container
        const svg2 = d3.select("#heatmap")
            .attr("width", "100%")
            .attr("height", "100%")
            .on("click", reset);

        const g = svg2.append("g");

        // Set up projections
        const projection = d3.geoMercator()
            .fitSize([850, 800], geoData);
        
        const [x, y] = projection.translate();
        projection.translate([x + 100, y]);


        const overviewProjection = d3.geoMercator()
            .fitSize([200, 180], geoData);
        
        // Hide overflow of hexagons outside the map boundaries
        svg2.append("clipPath")
            .attr("id", "map-clip")
            .append("path")
            .attr("d", d3.geoPath().projection(projection)(geoData));

        // Create overview map
        const overviewSvg = d3.select("#overviewMap");
        const overviewPath = d3.geoPath().projection(overviewProjection);
        
        // boundaries within overview map
        overviewSvg.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", overviewPath)
            .attr("fill", "#fffafe")
            .attr("stroke", "#555")
            .attr("stroke-width", 0.7);
        
        // highlighted area user is viewing
        const viewRect = overviewSvg.append("rect")
            .attr("class", "view-rect")
            .attr("fill", "none")
            // .attr("opacity", 0.5)
            .attr("stroke", "#89c6e0")
            .attr("stroke-width", 2.5);

        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("start", zoomStarted)
            .on("zoom", (event) => {
                zoomed(event); 
            });


        svg2.call(zoom);
        let currentData = crimeData;
       
        // Add crime data and boundaries
        if (crimeData && crimeData.length > 0) {
            addCrimeHeatmap(g, crimeData, fullData, projection);
            drawLegend();
        }
        const divisions = drawBoundaries(g, geoData, projection, clicked);

        // Tooltip setup
        const tooltip = d3.select("#heatmaptooltip");
        setupTooltip(divisions, tooltip, districtCrimeCounts);

        // Zoom/click handlers 
        function reset() { 
            divisions.transition().style("fill", null);
                svg2.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(svg2.node()).invert([900/2, 600/2])
                );
            g.selectAll(".hexbin-layer").remove();
            g.selectAll(".district-boundary").remove();

            addCrimeHeatmap(g, currentData, fullData, projection, 8);
            const resetDivisions = drawBoundaries(g, geoData, projection, clicked);
            
            setupTooltip(resetDivisions, tooltip, districtCrimeCounts);
        }
        // For when a user clicks into a district -> pan into district, update bar charts
        function clicked(event, d) { 
            const districtName = d.properties.APREC;
            if (districtName === "North Hollywood") {
                d.Area_Name = "N Hollywood";
            } else if (districtName === "West Los Angeles") {
                d.Area_Name = "West LA";
            }
            const [[x0, y0], [x1, y1]] = d3.geoPath().projection(projection).bounds(d);
            event.stopPropagation();
            divisions.transition().style("fill", null);
            svg2.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
                .translate(900/2, 600/2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / 900, (y1 - y0) / 600)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svg2.node())
            );
            g.selectAll(".hexbin-layer").remove();
            g.selectAll(".district-boundary").remove();

            addCrimeHeatmap(g, currentData, fullData, projection, 3);
            const zoomedDivisions = drawBoundaries(g, geoData, projection, clicked);
            setupTooltip(zoomedDivisions, tooltip, districtCrimeCounts);

            try {
                drawBarChart(crimeData, districtName);
              } catch (e) {
                console.error("Error in drawBarChart:", e);
              }
        }
        // When a user zooms into the map
        function zoomed(event) { 
            const {transform} = event;
                g.attr("transform", transform);
            
                const bbox = svg2.node().getBoundingClientRect();
                const mainWidth = bbox.width;
                const mainHeight = bbox.height;
            
                const topLeftScreen = transform.invert([0, 0]);
                const bottomRightScreen = transform.invert([mainWidth, mainHeight]);
            
                const topLeft = projection.invert(topLeftScreen);
                const bottomRight = projection.invert(bottomRightScreen);
            
                if (!topLeft || !bottomRight) return;
            
                const [x0, y0] = overviewProjection(topLeft);
                const [x1, y1] = overviewProjection(bottomRight);
            
                viewRect
                    .attr("x", Math.min(x0, x1))
                    .attr("y", Math.min(y0, y1))
                    .attr("width", Math.abs(x1 - x0))
                    .attr("height", Math.abs(y1 - y0));
        }
        function zoomStarted(event) { 
            if (event.sourceEvent && event.sourceEvent.type === "mousedown") {
                tooltip.style("display", "none");
            }
        }


        return {
            updateData: (newData, radius = 8) => {
                currentData = newData;

                // Update crime visualization when data changes
                g.selectAll(".hexbin-layer").remove();
                g.selectAll(".district-boundary").remove();
                
                addCrimeHeatmap(g, newData, fullData, projection, radius);
                const updatedDivisions = drawBoundaries(g, geoData, projection, clicked);
                setupTooltip(updatedDivisions, d3.select("#heatmaptooltip"), districtCrimeCounts);
                
           }
            
        };
    } catch (error) {
        console.error("Error initializing map:", error);
        throw error;
    }
}

// Helper functions
function addCrimeHeatmap(container, crimeData, fullData, projection, radius = 8) {
    const hexPoints = crimeData.map(d => {
        const coords = projection([+d.longitude, +d.latitude]);
        return coords && !isNaN(coords[0]) && !isNaN(coords[1]) ? coords : null;
    }).filter(Boolean);

    const hexbin = d3.hexbin()
        .radius(radius)
        .extent([[0, 0], [950, 800]]);

    const bins = hexbin(hexPoints);

    const hexColor = d3.scaleThreshold()
        .domain([1, 10, 25, 50, 100, 250, 500, 1000, 2000])
        .range(d3.schemeReds[9]);
    
    container.append("g")
        .attr("class", "hexbin-layer")
        .attr("clip-path", "url(#map-clip)")
        .selectAll("path")
        .data(bins)
        .join("path")
        .attr("d", hexbin.hexagon())
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("fill", d => hexColor(d.length))
        .attr("stroke", "none")
        .attr("opacity", 0.7)
        .style("pointer-events", "none");
    
}

// draw boundaries of districts and map
function drawBoundaries(container, geoData, projection, clicked) {
    const boundaryGroup = container.append("g")
        .attr("class", "district-boundary");

    const divisions = boundaryGroup.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "rgba(0,0,0,0.01)") //make it almost transparent because svg paths without fill aren't interactive by default 
        .attr("stroke", "#403f3e")
        .attr("stroke-width", 0.7)
        .on("click", clicked);

    return divisions;
}

//Draw the color scale legend for heat map
function drawLegend() {
    const legendWidth = 300;
    const legendHeight = 50;

    const thresholds = [1, 10, 25, 50, 100,250, 500, 1000, 2000];
    const colors = d3.schemeReds[9];

    const svg = d3.select("#legend")
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    const legendGroup = svg.append("g")
        .attr("transform", "translate(30, 20)");

    // Draw color boxes
    legendGroup.selectAll("rect")
        .data(colors)
        .join("rect")
        .attr("x", (d, i) => i * ((legendWidth - 60) / colors.length))
        .attr("y", 0)
        .attr("width", (legendWidth - 60) / colors.length)
        .attr("height", 10)
        .attr("fill", d => d);

    // Draw labels under each threshold
    legendGroup.selectAll("text")
        .data(thresholds)
        .join("text")
        .attr("x", (d, i) => i * ((legendWidth - 60) / colors.length))
        .attr("y", 25)
        .text(d => d)
        .style("font-size", "10px")
        .attr("text-anchor", "middle");

    // Add a title
    svg.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .text("Crime Count")
        .style("font-size", "12px")
        .style("font-weight", "bold");
}

// Render Tooltip
function setupTooltip(divisions, tooltip, districtCrimeCounts) {
    const districtCrimeMap = {};
    districtCrimeCounts.forEach(d => {
        districtCrimeMap[d.area_name] = d;
    });
    divisions
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            const name = d.properties.APREC;
            const total = districtCrimeMap[name]?.count || 0;

            tooltip
                .style("display", "block")
                .style("background-color", "rgba(255, 255, 255, 0.9)")
                .style("border", "1px solid black")
                .style("border-radius", "7px")
                .style("padding", "5px")
                .style("color", "#403f3e")
                .style("font-family", "sans-serif")
                .style("font-size", "12px")
                .html(`
                    <div>
                        <strong>${name}</strong>
                        <p>Total Number of Crimes: ${total}</p>
                    </div>
                `);       
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
}

//Timeline
// Global variables for getStartDate() and getEndDate()
let timelineBrushSelection = null;
let timelineBrushDefault = null;
const formateTimelineDate = d3.timeFormat("%m/%d/%Y %I:%M:%S %p");

function drawTimeline(crimeData) {
    d3.select("#timeline").selectAll("svg").remove();

    const timeline = document.querySelector("#timeline");
    const timelineWidth = timeline.clientWidth;
    const timelineHeight = timeline.clientHeight;

    const svg = d3.select("#timeline")
        .append("svg")
        .attr("width", timelineWidth)
        .attr("height", timelineHeight)
        .style("user-select", "none");

    // Parse DATE_OCC into readable dates
    const parseDate = d3.timeParse("%m/%d/%Y %I:%M:%S %p");
    crimeData.forEach(d => {
        d.parsedDateOcc = parseDate(d["DATE OCC"]);
    });

    crimeData.sort((a, b) => d3.ascending(a.parsedDateOcc, b.parsedDateOcc));
    const extent = d3.extent(crimeData, d => d.parsedDateOcc);

    timelineBrushDefault = [
        formateTimelineDate(crimeData[0].parsedDateOcc),
        formateTimelineDate(crimeData[crimeData.length - 1].parsedDateOcc)
    ];
    console.log(timelineBrushDefault);

    const xScale = d3.scaleTime()
        .domain(extent)
        .range([40, timelineWidth - 40]);

    const yPos = timelineHeight / 4;

    // Scale ticks on timeline for better viewing
    function getExtendedTicks(scale, extent) {
        const ticks = scale.ticks(8);
        const lastTick = ticks[ticks.length - 1];
        const maxDate = extent[1];

        if ((maxDate - lastTick) / (maxDate - extent[0]) > 0.01) {
            ticks.push(maxDate);
        }
        return ticks;
    }

    const xAxis = d3.axisBottom(xScale)
        .tickValues(getExtendedTicks(xScale, extent))
        .tickFormat(d3.timeFormat("%b %d, %Y"));
    
    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${yPos + 30})`)
        .call(xAxis);

    // Bounding box for zooming on timeline
    const zoomRect = svg.append("rect")
        .attr("class", "zoom-region")
        .attr("x", 0)
        .attr("y", timelineHeight / 2)
        .attr("width", timelineWidth)
        .attr("height", timelineHeight / 2)
        .attr("fill", "transparent")
        .style("cursor", "grab")
        .call(d3.zoom()
            .filter(event => event.type === "wheel")
            .scaleExtent([1, 100])
            .translateExtent([[0, 0], [timelineWidth, timelineHeight]])
            .extent([[0, 0], [timelineWidth, timelineHeight]])
            .on("zoom", zoomed)
        )
        .raise();
    
    const brush = d3.brushX()
        .extent([[40, 0], [timelineWidth - 40, timelineHeight / 2]])
        .on("end", brushed);

    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    let currentXScale = xScale;

    function zoomed(event) {
        currentXScale = event.transform.rescaleX(xScale);
        const newExtent = currentXScale.domain();

        const dynamicAxis = d3.axisBottom(currentXScale)
            .tickValues(getExtendedTicks(currentXScale, newExtent))
            .tickFormat(d3.timeFormat("%b %d, %Y"));

        xAxisGroup.call(dynamicAxis);

        if (timelineBrushSelection) {
            const [start, end] = timelineBrushSelection;
            brushGroup.call(brush.move, [currentXScale(start), currentXScale(end)]);
        }
    }

    function brushed(event) {
        if (!event.selection) {
            timelineBrushSelection = null;
            return;
        }

        const [x0, x1] = event.selection;
        const start = currentXScale.invert(x0);
        const end = currentXScale.invert(x1);
        timelineBrushSelection = [start, end];

        getStartDate();
        getEndDate();
    }
}

// return the start and end dates of range selected by user on timeline

export function getStartDate() {
    if (timelineBrushSelection) return formateTimelineDate(timelineBrushSelection[0]);
    if (timelineBrushDefault) return timelineBrushDefault[0];
    return "01/01/2022 12:00:00 AM"; // This is the first entry in the dataset. Needed to return something for index.js
}

export function getEndDate() {
    if (timelineBrushSelection) return formateTimelineDate(timelineBrushSelection[1]);
    if (timelineBrushDefault) return timelineBrushDefault[1];
    return "12/29/2024 12:00:00 AM"; // This is the last entry in the dataset. Needed to return something for index.js
}