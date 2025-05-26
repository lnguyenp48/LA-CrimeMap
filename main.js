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

    console.log(rawData); //To verify that the code runs correctly up to this point

    const processedData = rawData.map(d=>{
        return {
            //Colors

            //Map

            //Timeline (? Unsure if it needs this)

            //Bar Charts
            "Vict_Age": d.Vict_Age,
            "Vict_Sex": d.Vict_Sex
            //Add more things to bar chart, need to check which data means what
                
            //Alluvial Diagriam 
            };
        });
    console.log("processedData", processedData); //To verify that the data was processed correctly via inspecting
    //Unsure if credit the HW3 that this was based on^

    // TODO: data parsing (as needed)

    // create svg
    const svg = d3.select("svg"); 

    // MAP PLOT:

    // TIMELINE SCROLLING:

    // ADDITIONAL PLOTS:
    //Bar Charts - Victim Age
    //process data here, check which location is the one that should be used
    //Processing data and amount for Victim Age
    const victAgeCounts = processedData.reduce((s, { Vict_Age }) => (s[Vict_Age] = (s[Vict_Age] || 0) + 1, s), {});
    const victAgeData = Object.keys(victAgeCounts).map((key) => ({ Vict_Age: key, count: victAgeCounts[key] }));
    console.log("victAgeData", victAgeData);
    //CHECK WHICH LOCATION IS THE ONE USED HERE [Likely Area]

    barChartVicAge = svg.append("g")
        .attr("width", barColumnWidth + barColumnMargin.left + barColumnMargin.right)
        .attr("height", barColumnHeight + barColumnMargin.top + barColumnHeight.bottom)
        .attr("transform", `translate(${barColumnMargin.left}, ${barColumnTop})`)

    
    //Bar Charts - Victim Sex
    barChartVicSex = svg.append("g")
        .attr("width", barColumnWidth + barColumnMargin.left + barColumnMargin.right)
        .attr("height", barColumnHeight + barColumnMargin.top + barColumnHeight.bottom)
        .attr("transform", `translate(${barColumnMargin.left}, ${barColumnTop})`)
        //Likely add some multiplier to the width/heights/etc. to make sure the spacing is consitient, wait until they can show up to experiment
    
    //Referenced HW3 for the Bar Charts [add more official looking reference later]


    // ALLUVIAL PLOT:

    
    }).catch(function(error) {
    console.log(error);
});

///
