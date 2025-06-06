export const timelineDispatcher  = d3.dispatch("brushChanged");

export async function drawTimeline(crimeData, onBrush) {
    try {
        d3.select("#timeline").selectAll("svg").remove();

        const timeline = document.querySelector("#timeline");
        const timelineWidth = timeline.clientWidth;
        const timelineHeight = timeline.clientHeight;

        let timelineBrushSelection = null;
        let timelineBrushDefault = null;
        const formatTimelineDate = d3.timeFormat("%m/%d/%Y %I:%M:%S %p");

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
            formatTimelineDate(crimeData[0].parsedDateOcc),
            formatTimelineDate(crimeData[crimeData.length - 1].parsedDateOcc)
        ];

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

        // Handle zoom
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

        // Handle brush
        function brushed(event) {
            if (!event.selection) {
                timelineBrushSelection = null;

                timelineDispatcher.call("brushChanged", null, [
                    timelineBrushDefault[0],
                    timelineBrushDefault[1]
                ])
                return;
            }

            const [x0, x1] = event.selection;
            const start = currentXScale.invert(x0);
            const end = currentXScale.invert(x1);
            timelineBrushSelection = [start, end];

            // Dispatch call to index.js to update heatmap
            timelineDispatcher.call("brushChanged", null, [
                formatTimelineDate(start),
                formatTimelineDate(end)
            ]);
        }

        if (timelineBrushSelection) {
            return timelineBrushSelection;
        } else {
            return timelineBrushDefault;
        }

    } catch (error) {
        console.error("Error initializing timeline:", error);
        throw error;
    } 
}