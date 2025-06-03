// boundaries and margin setup
const width = window.innerWidth;
const height = window.innerHeight;

// TODO: margins for each section here
let mapLeft = 0, mapTop = 0
let mapMargin = {top: 0, right: 0, bottom: 0, left: 0},
    mapWidth = width,
    mapHeight = height;
//Modify margins for main map as needed

let barColumnLeft = mapLeft + 50, barColumnTop = 0
let barColumnMargin = {top: 0, right: 0, bottom: 0, left: 0},
    barColumnWidth = width/4 - mapLeft,
    barColumnHeight = height;
//Modify margins for bar columns as needed

//Likely need more margins

const areaCrimeCounts = [];

/** REFERENCES
 *  1. ChatGPT for guidance and syntax help: knowing to get a geojson file, how to load it, etc
 *  2. https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/
 *  3. https://d3-graph-gallery.com/graph/interactivity_tooltip.html#position
 *  4. https://observablehq.com/@d3/zoom-to-bounding-box 
 *  5. https://observablehq.com/@davidnmora/d3-zoom-gentle-introduction 
**/

// default projection
const projection = d3.geoMercator()
    .fitSize([900, 800], { type: "FeatureCollection", features: [] }); 

// load geoJSON data for LAPD districts
const geoData = d3.json("data/lapd_districts.geojson");
console.log("geodata", geoData);

/*
 * MAIN PLOTS
 */

d3.csv("Crime_Data_from_2020_to_Present.csv").then(rawData => {
    
    // grabbing all raw data... we can adjust for what we actually end up using later
    rawData.forEach(function(d) {
        d.DR_NO = Number(d.DR_NO);
        d.Date_Rptd = String(d["Date Rptd"]); // idk if this should b a string or not? we might have to reformat it
        d.DATE_OCC = String(d["DATE OCC"]);
        d.TIME_OCC = Number(d["TIME OCC"]);
        d.AREA = Number(d.AREA);
        d.AREA_NAME = String(d["AREA NAME"]);
        d.Rpt_Dist_No = Number(d["Rpt Dist No"]);
        d.Part = Number(d["Part 1-2"]);
        d.Crm_Cd = Number(d["Crm Cd"]);
        d.Crm_Cd_Desc = String(d["Crm Cd Desc"]);
        d.Mocodes = String(d.Mocodes); // this may need to be changed
        d.Vict_Age = Number(d["Vict Age"]);
        d.Vict_Sex = String(d["Vict Sex"]);
        d.Vict_Descent = String(d["Vict Descent"]);
        d.Premis_Cd = Number(d["Premis Cd"]);
        d.Premis_Desc = String(d["Premis Desc"]);
        d.Weapon_Used_Cd = Number(d["Weapon Used Cd"]);
        d.Weapon_Desc = String(d["Weapon Desc"]);
        d.Status = String(d.Status);
        d.Status_Desc = String(d["Status Desc"]);
        d.Crm_Cd_1 = Number(d["Crm Cd 1"]);
        d.Crm_Cd_2 = Number(d["Crm Cd 2"]);
        d.Crm_Cd_3 = Number(d["Crm Cd 3"]);
        d.Crm_Cd_4 = Number(d["Crm Cd 4"]);
        d.LOCATION = String(d.LOCATION);
        d.Cross_Street = String(d["Cross Street"]);
        d.LAT = Number(d.LAT);
        d.LON = Number(d.LON);
    })

    // console.log(rawData); //To verify that the code runs correctly up to this point

    const processedData = rawData.map(d=>{
        
        return {
            //Colors

            //Map
            "Area": d.AREA,
            "Area_Name": d.AREA_NAME,

            //Timeline (? Unsure if it needs this)
            "Date_Rptd": d.Date_Rptd,
            "DATE_OCC": d.DATE_OCC, //Check which time is used

            //Bar Charts
            "Vict_Age": d.Vict_Age,
            "Vict_Sex": d.Vict_Sex
            //Add more things to bar chart, need to check which data means what
                
            //Alluvial Diagriam 
            };
        });
    // console.log("processedData", processedData); //To verify that the data was processed correctly via inspecting
    //Unsure if credit the HW3 that this was based on^

    // TODO: data parsing (as needed)

    // counting up the amount of crime in each area
    const areas = {};
    processedData.forEach(d => {
        if (d.Area_Name in areas) {
            areas[d.Area_Name].count += 1;
        } else {
            const area = {
                area: d.Area,
                area_name: d.Area_Name,
                count: 1
            }
            areas[d.Area_Name] = area;
        }
    })
    Object.keys(areas).forEach(d => { areaCrimeCounts.push(areas[d]); });

    // create svg
    const svg = d3.select("#barCharts"); 

    // MAP PLOT:

    // TIMELINE SCROLLING:

    // ADDITIONAL PLOTS:

    //Function to get data based on year and location
    //Doesn't work, but I think the idea of how it works is something along these lines
    function organizeData (time, location) {
        const object = {};
        processedData.forEach(d => {
            if (d.AREA_NAME == location && d.DATE_OCC == time) { //syntax likely not right for DATE_OCC, check how to only check certain parts of a string
                if (d.Area_Name in object) {
                    object[d.AREA_NAME].count += 1;
                }
                else {
                    const object = {
                        area: d.Area,
                        area_name: d.Area_Name,
                        Date_OCC: d.DATE_OCC,
                        count: 1,
    
                        //Other Paramaters that will likely be organized by [more to be added]
                        Vict_Age: d.Vict_Age,
                        Vict_Sex: d.Vict_Sex 
    
                    }
                }
            }
        })
        return object;
    }

    //Bar Charts - Victim Age
    //process data here, check which location is the one that should be used
    //Processing data and amount for Victim Age
    var test = {};
    test = organizeData("2022", "Northeast"); //"02/16/2022 12:00:00 AM"
    console.log(test)


    const victAgeCounts = processedData.reduce((s, { Vict_Age }) => (s[Vict_Age] = (s[Vict_Age] || 0) + 1, s), {});
    const victAgeData = Object.keys(victAgeCounts).map((key) => ({ Vict_Age: key, count: victAgeCounts[key] }));
    // console.log("victAgeData", victAgeData);

    const barChartVicAge = svg.append("g")
        .attr("width", barColumnWidth + barColumnMargin.left + barColumnMargin.right)
        .attr("height", barColumnHeight + barColumnMargin.top + barColumnHeight.bottom)
        .attr("transform", `translate(${barColumnMargin.left}, ${barColumnTop})`)

    
    //Bar Charts - Victim Sex
    const barChartVicSex = svg.append("g")
        .attr("width", barColumnWidth + barColumnMargin.left + barColumnMargin.right)
        .attr("height", barColumnHeight + barColumnMargin.top + barColumnHeight.bottom)
        .attr("transform", `translate(${barColumnMargin.left}, ${barColumnTop})`)
        //Likely add some multiplier to the width/heights/etc. to make sure the spacing is consitient, wait until they can show up to experiment
    
    //Referenced HW3 for the Bar Charts [add more official looking reference later]

    // HEATMAP STUFF

    const svg2 = d3.select("#heatmap")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .on("click", reset);
    
    const g = svg2.append("g");
    const colorscheme = d3.scaleQuantize([1,10], d3.schemeBlues[9]); // can change later probably
    const countColor = new Map(areaCrimeCounts.map(d => [d.area, d.count]));
    console.log(countColor);

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
            .attr("fill", d => colorscheme(countColor.get(d.area)))
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

///