/** REFERENCES
 *  1. ChatGPT for guidance and syntax help: knowing to get a geojson file, how to load it, etc
 *  2. https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/
 *  3. https://d3-graph-gallery.com/graph/interactivity_tooltip.html#position
 *  4. https://observablehq.com/@d3/zoom-to-bounding-box 
 *  5. https://observablehq.com/@davidnmora/d3-zoom-gentle-introduction 
**/

export async function initMap(crimeData) {
    try {
        const [geoData] = await Promise.all([
            d3.json("data/lapd_districts.geojson")
        ]);

        // Create SVG container
        const svg2 = d3.select("#heatmap")
            .attr("width", "100%")
            .attr("height", "100%")
            .on("click", reset);

        const g = svg2.append("g");

        // Set up projections
        const projection = d3.geoMercator()
            .fitSize([900, 800], geoData);

        const overviewProjection = d3.geoMercator()
            .fitSize([200, 150], geoData);

            svg2.append("clipPath")
            .attr("id", "map-clip")
            .append("path")
            .attr("d", d3.geoPath().projection(projection)(geoData));

        // Create overview map
        const overviewSvg = d3.select("#overviewMap");
        const overviewPath = d3.geoPath().projection(overviewProjection);
        
        overviewSvg.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", overviewPath)
            .attr("fill", "#eee")
            .attr("stroke", "#555");
            
        const viewRect = overviewSvg.append("rect")
            .attr("class", "view-rect")
            .attr("fill", "none")
            .attr("fill", "gray")
            .attr("opacity", 0.3)
            .attr("stroke-width", 1.5);

        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("start", zoomStarted)
            .on("zoom", (event) => {
                console.log("Zoom event fired:", event.transform); 
                zoomed(event); 
            });

        svg2.call(zoom);

       
        // Add crime data and boundaries
        if (crimeData && crimeData.length > 0) {
            addCrimeHeatmap(g, crimeData, projection);
        }
        const divisions = drawBoundaries(g, geoData, projection, clicked);


        // Tooltip setup
        const tooltip = d3.select("#heatmaptooltip");
        setupTooltip(divisions, tooltip);

        // Zoom/click handlers 
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
                // d3.select(this).transition().style("fill", "red");
                svg2.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                    .translate(900/2, 600/2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / 900, (y1 - y0) / 600)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, svg2.node())
                );
        }
        function zoomed(event) { 
            const transform = event.transform;
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
            updateData: (newData) => {
                // Update crime visualization when data changes
                g.selectAll(".hexbin-layer").remove();
                g.selectAll(".district-boundary").remove();

                addCrimeHeatmap(g, newData, projection);
                const updatedDivisions = drawBoundaries(g, geoData, projection, clicked);
                setupTooltip(updatedDivisions, d3.select("#heatmaptooltip"));
            }
        };

    } catch (error) {
        console.error("Error initializing map:", error);
        throw error;
    }
}

// Helper functions
function addCrimeHeatmap(container, crimeData, projection) {
    const hexPoints = crimeData.map(d => {
        const coords = projection([+d.longitude, +d.latitude]);
        return coords && !isNaN(coords[0]) && !isNaN(coords[1]) ? coords : null;
    }).filter(Boolean);

    const hexbin = d3.hexbin()
        .radius(8)
        .extent([[0, 0], [900, 800]]);

    const bins = hexbin(hexPoints);

    const hexColor = d3.scaleThreshold()
        .domain([1, 10, 25, 50, 100, 500, 1000, 2000])
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
        .attr("opacity", 0.7);
}

function setupTooltip(divisions, tooltip) {
    divisions
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .html(`<strong>${d.properties.APREC}</strong>`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
}
function drawBoundaries(container, geoData, projection, clicked) {
    const boundaryGroup = container.append("g")
        .attr("class", "district-boundary");

    const divisions = boundaryGroup.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 1.5)
        .on("click", clicked);

    return divisions;
}