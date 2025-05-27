/** REFERENCES
 *  1. ChatGPT for guidance and syntax help: knowing to get a geojson file, how to load it, etc
 *  2. https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/
 *  3. https://d3-graph-gallery.com/graph/interactivity_tooltip.html#position
**/

const svg2 = d3.select("#heatmap");

// responsive to browser resizing
svg2.attr("viewBox", "0 0 900 800")
   .attr("width", "100%")
   .attr("height", "100%");

// default projection
const projection = d3.geoMercator()
    .fitSize([900, 800], { type: "FeatureCollection", features: [] }); 

// load geoJSON data for LAPD districts
d3.json("data/lapd_districts.geojson").then(geoData => {
    projection.fitSize([900, 800], geoData); // Refit projection based on actual GeoJSON bounds
    const tooltip = d3.select("#mapTooltip");
    svg2.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "#f2f2f2")
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
        });
});
