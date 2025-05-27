/** REFERENCES
 *  1. ChatGPT for guidance and syntax help: knowing to get a geojson file, how to load it, etc
 *  2. https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/
 *  3. https://d3-graph-gallery.com/graph/interactivity_tooltip.html#position
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
        .on("click", reset)

    // const colorscheme = d3.scaleQuantize([1,10], d3.schemeBlues[9]); // can change later probably

    projection.fitSize([900, 600], geoData); // Refit projection based on actual GeoJSON bounds
    const tooltip = d3.select("#heatmaptooltip");

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    const divisions = svg2.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
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
    
    function reset() {
        divisions.transition().style("fill", null);
        svg2.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg2.node()).invert([900/2, 600/2])
        );
    }

    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = d3.geoPath().projection(projection).bounds(d);
        event.stopPropagation();
        divisions.transition().style("fill", null);
        d3.select(this).transition().style("fill", "red");
        svg2.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
              .translate(900/2, 600/2)
              .scale(Math.min(8, 0.9 / Math.max((x1-x0) / 900, (y1 - y0) / 600)))
              .translate(-(x0 + x1) / 2, -(y0+y1) / 2),
            d3.pointer(event, svg2.node())
        );
    }

    function zoomed(event) {
        const {transform} = event;
        svg2.append("g").attr("transform", transform);
        svg2.append("g").attr("stroke-width", 1 / transform.k);
    }

    }).catch(function(error) {
    console.log(error);
});