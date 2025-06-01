/** REFERENCES
 *  1. ChatGPT for guidance and syntax help: knowing to get a geojson file, how to load it, etc
 *  2. https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/
 *  3. https://d3-graph-gallery.com/graph/interactivity_tooltip.html#position
 *  4. https://observablehq.com/@d3/zoom-to-bounding-box 
 *  5. https://observablehq.com/@davidnmora/d3-zoom-gentle-introduction 
**/

// import rawData from main
// import { exportedData } from "./main.js";

const areaCrimeRate = new Map();

// this is broken rn sorry omg ;-;
await import('./main.js').then(moduleA => {
    console.log(moduleA.exportedData);
});

// default projection
const projection = d3.geoMercator()
    .fitSize([900, 800], { type: "FeatureCollection", features: [] }); 

// load geoJSON data for LAPD districts
d3.json("data/lapd_districts.geojson").then(geoData => {

    const svg2 = d3.select("#heatmap")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .on("click", reset);
    
    const g = svg2.append("g");
    // const colorscheme = d3.scaleQuantize([1,10], d3.schemeBlues[9]); // can change later probably

    projection.fitSize([900, 600], geoData); // Refit projection based on actual GeoJSON bounds
    const tooltip = d3.select("#heatmaptooltip");
    const overviewSvg = d3.select("#overviewMap");
    const overviewWidth = 200, overviewHeight = 150;

    const overviewProjection = d3.geoMercator()
        .fitSize([overviewWidth, overviewHeight], geoData);

    const overviewPath = d3.geoPath().projection(overviewProjection);

    const overviewG = overviewSvg.append("g");
    overviewG.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", overviewPath)
        .attr("fill", "#eee")
        .attr("stroke", "#555");

    const viewRect = overviewSvg.append("rect")
        .attr("fill", "gray")
        .attr("stroke", "red")
        .attr("opacity", 0.3)
        .attr("stroke-width", 1);
    
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("start", zoomStarted)
        .on("zoom", zoomed)
        // .on("end", zoomEnded);

    function zoomEnded(event) {
        // Run if dragging (mousedown + mouseup)
        if (event.sourceEvent && event.sourceEvent.type === "mouseup") {
            // get mouse position
            const [mx, my] = d3.pointer(event.sourceEvent, svg2.node());
    
            //find element under mouse
            const element = document.elementFromPoint(event.sourceEvent.clientX, event.sourceEvent.clientY);
            
            //check if element under mouse is a district since the map disttricts are rendered as SVG <path> elements
            if (element && element.tagName === "path") {
                //wraps DOM element that is under moust in a d3 selection so can use D3 methods on it then datum gets the data object boung to that DOM
                const d = d3.select(element).datum();
                    tooltip.style("display", "block")
                        .html(`<strong>${d.properties.APREC}</strong>`)
                        .style("left", (event.sourceEvent.pageX + 10) + "px")
                        .style("top", (event.sourceEvent.pageY + 10) + "px");  
            }
        }
    }

    const divisions = g.selectAll("path")
        .data(geoData.features)
        .join("path")
            .attr("d", d3.geoPath().projection(projection))
            .attr("fill", "#8800ffaa")
            .attr("stroke", "#333")

            .on("mouseover", function(event, d) {
                const districtName = d.properties.APREC;
                tooltip.style("display", "block")
                    .html(`<strong>${districtName}</strong>`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("click", clicked);

    svg2.call(zoom);
    
    // ZOOM FUNCTIONS :
    // reset
    function reset() {
        divisions.transition().style("fill", null);
        svg2.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg2.node()).invert([900/2, 600/2])
        );
    }

    // when you click on a division
    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = d3.geoPath().projection(projection).bounds(d);
        event.stopPropagation();
        divisions.transition().style("fill", null);
        d3.select(this).transition().style("fill", "red");
        svg2.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
              .translate(900/2, 600/2)
              .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / 900, (y1 - y0) / 600)))
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg2.node())
        );
    }

    // calling the transformations? idk how this works lowkey lol
    function zoomed(event) {
        const transform = event.transform;
        g.attr("transform", transform);
    
        // Get the corners of the visible area in screen space
        const topLeftScreen = [0, 0];
        const bottomRightScreen = [900, 600];
    
        // Invert the transform to get those points in geographic coordinates
        const topLeftGeo = projection.invert(transform.invert(topLeftScreen));
        const bottomRightGeo = projection.invert(transform.invert(bottomRightScreen));
    
        // Project those geographic coordinates into the overview projection
        const [x0, y0] = overviewProjection(topLeftGeo);
        const [x1, y1] = overviewProjection(bottomRightGeo);
    
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
    
    function isMouseDown(event){
        event.sourceEvent.type === "mousedown" 
    }
    
    }).catch(function(error) {
    console.log(error);
});