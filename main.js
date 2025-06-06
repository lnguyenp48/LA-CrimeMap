//This function completes general processing of dataset 
export async function loadCrimeData(dataset) {
    try {
        if(!dataset){
            return [];
        }
        // Process raw data
        const processedData = dataset.map(d => ({
            Area: +d.AREA,
            Area_Name: d["AREA NAME"],
            latitude: +d.LAT,
            longitude: +d.LON,
            Date_Rptd: d["Date Rptd"],
            DATE_OCC: d["DATE OCC"],
            Vict_Age: +d["Vict Age"],
            Vict_Sex: d["Vict Sex"],
            Premise: d["Premis Desc"]
        }));

        // Filter valid coordinates
        const validCrimeData = processedData.filter(d => 
            d.latitude && d.longitude && 
            d.latitude !== 0 && d.longitude !== 0 &&
            !isNaN(d.latitude) && !isNaN(d.longitude)
        );

        console.log("Processed crime data:", validCrimeData.length, "records");
        return validCrimeData;

    } catch (error) {
        console.error("Error loading crime data:", error);
        return []; // Return empty array if error occurs
    }
}

function getMonthYear(dateInput) {
    const parseDate = d3.timeParse("%m/%d/%Y %I:%M:%S %p");
    const date = parseDate(dateInput);
    return {
        month: date.getMonth() + 1, // 1-based month (1 = Jan)
        year: date.getFullYear()
    };
}
// This function filters the original crime dataset based on the type of crime committed
// type: keyword used to filter data that matches this type
// returns data array with all incidents matching the type of crime user wants to filter for 
export async function filterCrimesByType(type, startDate, endDate) {
    const data = await d3.csv("Crime_Data_from_2020_to_Present.csv");
    const sexCrimes = ["beastiality", "indecent exposure", "lewd", "pimping", "peeping tom"];

    const { month: start_month, year: start_year } = getMonthYear(startDate);
    const { month: end_month, year: end_year } = getMonthYear(endDate);

    return data.filter(d => {
        const { month, year } = getMonthYear(d["DATE OCC"]);
        // outside year range = automatically no
        if(year > end_year || year < start_year) return false;
        
        if (year === start_year && month < start_month) return false;
        if (year === end_year && month > end_month) return false;
        
        const desc = d["Crm Cd Desc"]?.toLowerCase() || "";
        switch (type) {
            case "battery_assault":
                return desc.includes("assault") || desc.includes("battery");

            case "minors":
                return desc.includes("child");

            case "burglary_theft":
                return desc.includes("burglary") || desc.includes("theft") || desc.includes("purse snatching");

            case "sexual":
                return sexCrimes.some(term => desc.includes(term));

            case "all":
                return true;

        }
    });
}
// This function filters the original crime dataset based on the type of crime committed
// type: keyword used to filter data that matches this type
// returns data array with all incidents matching the type of crime user wants to filter for 
export async function getLocationCounts(filteredDataset, district = "all") {
    const locationTypes = {
        school: 0,
        public_transportation: 0,
        retail: 0,
        residence: 0,
        sidewalk: 0
    };

    filteredDataset.forEach(d => {
        if (district !== "all" && d.Area_Name.toUpperCase() !== district.toUpperCase()) {
            return;
        }

        const location = d.Premise.toUpperCase();

        if(location.includes("SCHOOL")){
            locationTypes["school"]++;
        }
        if(location.includes("BUS") || location.includes("MTA")) {
            locationTypes["public_transportation"]++;
        } 
        if(location.includes("SHOP") || location.includes("STORE")) {
            locationTypes["retail"]++;
        } 
        if(location.includes("APARTMENT") || location.includes("TOWNHOUSE") || location.includes("GARAGE") || location.includes("DWELLING") || location.includes("DRIVEWAY")) {
            locationTypes["residence"]++;
        } 
        if(location.includes("SIDEWALK")) {
            locationTypes["sidewalk"]++;
        } 
    });

    console.log("HERE", locationTypes);
    return locationTypes;
}
export async function countCrimes(dataset) {
    try {
        if (!dataset) {
            dataset = await d3.csv("Crime_Data_from_2020_to_Present.csv");
            console.log("dataset", dataset);
        }

        const areas = {};

        dataset.forEach(d => {
            if (d.Area_Name === "N Hollywood") {
                d.Area_Name = "North Hollywood";
            } else if (d.Area_Name === "West LA") {
                d.Area_Name = "West Los Angeles";
            }
            const areaName = d.Area_Name?.toUpperCase(); 
            const areaCode = +d.Area;

            if (!areaName) return;

            if (areas[areaName]) {
                areas[areaName].count += 1;
            } else {
                areas[areaName] = {
                    area: areaCode,
                    area_name: areaName,
                    count: 1
                };
            }
        });

        return Object.values(areas);

    } catch (error) {
        console.error("Error loading crime data:", error);
        return [];
    }
}

// export async function loadCrimeData() {
//     // boundaries and margin setup
// const width = window.innerWidth;
// const height = window.innerHeight;

// // TODO: margins for each section here
// let mapLeft = 0, mapTop = 0
// let mapMargin = {top: 0, right: 0, bottom: 0, left: 0},
//     mapWidth = width,
//     mapHeight = height;
// //Modify margins for main map as needed

// let barColumnLeft = mapLeft + 50, barColumnTop = 0
// let barColumnMargin = {top: 0, right: 0, bottom: 0, left: 0},
//     barColumnWidth = width/4 - mapLeft,
//     barColumnHeight = height;
// //Modify margins for bar columns as needed

// //Likely need more margins

// let exportedData = [];
// /*
//  * MAIN PLOTS
//  */

// d3.csv("Crime_Data_from_2020_to_Present.csv").then(rawData => {
   
//     // grabbing all raw data... we can adjust for what we actually end up using later
//     rawData.forEach(function(d) {
//         d.DR_NO = Number(d.DR_NO);
//         d.Date_Rptd = String(d["Date Rptd"]); // idk if this should b a string or not? we might have to reformat it
//         d.DATE_OCC = String(d["DATE OCC"]);
//         d.TIME_OCC = Number(d["TIME OCC"]);
//         d.AREA = Number(d.AREA);
//         d.AREA_NAME = String(d["AREA NAME"]);
//         d.Rpt_Dist_No = Number(d["Rpt Dist No"]);
//         d.Part = Number(d["Part 1-2"]);
//         d.Crm_Cd = Number(d["Crm Cd"]);
//         d.Crm_Cd_Desc = String(d["Crm Cd Desc"]);
//         d.Mocodes = String(d.Mocodes); // this may need to be changed
//         d.Vict_Age = Number(d["Vict Age"]);
//         d.Vict_Sex = String(d["Vict Sex"]);
//         d.Vict_Descent = String(d["Vict Descent"]);
//         d.Premis_Cd = Number(d["Premis Cd"]);
//         d.Premis_Desc = String(d["Premis Desc"]);
//         d.Weapon_Used_Cd = Number(d["Weapon Used Cd"]);
//         d.Weapon_Desc = String(d["Weapon Desc"]);
//         d.Status = String(d.Status);
//         d.Status_Desc = String(d["Status Desc"]);
//         d.Crm_Cd_1 = Number(d["Crm Cd 1"]);
//         d.Crm_Cd_2 = Number(d["Crm Cd 2"]);
//         d.Crm_Cd_3 = Number(d["Crm Cd 3"]);
//         d.Crm_Cd_4 = Number(d["Crm Cd 4"]);
//         d.LOCATION = String(d.LOCATION);
//         d.Cross_Street = String(d["Cross Street"]);
//         d.LAT = Number(d.LAT);
//         d.LON = Number(d.LON);
//     })

//     // console.log(rawData); //To verify that the code runs correctly up to this point

//     const processedData = rawData.map(d=>{
        
//         return {
//             //Colors

//             //Map
//             "Area": d.AREA,
//             "Area_Name": d.AREA_NAME,
//             "latitude": d.LAT,
//             "longitude": d.LON,

//             //Timeline (? Unsure if it needs this)
//             "Date_Rptd": d.Date_Rptd,
//             "DATE_OCC": d.DATE_OCC, //Check which time is used

//             //Bar Charts
//             "Vict_Age": d.Vict_Age,
//             "Vict_Sex": d.Vict_Sex
//             //Add more things to bar chart, need to check which data means what
                
//             //Alluvial Diagriam 
//             };
//         });
//     // console.log("processedData", processedData); //To verify that the data was processed correctly via inspecting
//     //Unsure if credit the HW3 that this was based on^
//     console.log(processedData[1]);
//     const validCrimeData = processedData.filter(d => 
//         d.latitude && d.longitude && 
//         d.latitude !== 0 && d.longitude !== 0 &&
//         !isNaN(d.latitude) && !isNaN(d.longitude)
//     );
//     console.log(validCrimeData[1]);
//     exportedCoordinates = validCrimeData;
//     return validCrimeData;

//     // TODO: data parsing (as needed)

//     // counting up the amount of crime in each area
//     const areas = {};
//     processedData.forEach(d => {
//         if (d.Area_Name in areas) {
//             areas[d.Area_Name].count += 1;
//         } else {
//             const area = {
//                 area: d.Area,
//                 area_name: d.Area_Name,
//                 count: 1
//             }
//             areas[d.Area_Name] = area;
//         }
//     })
//     const areaCrimeCounts = [];
//     Object.keys(areas).forEach(d => { areaCrimeCounts.push(areas[d]); });

//     exportedData = areaCrimeCounts; // IDK HOW ELSE TO SEND IT TO HEATMAP.JS 

//     // create svg
//     const svg = d3.select("#barCharts"); 

//     // MAP PLOT:

//     // TIMELINE SCROLLING:

//     // ADDITIONAL PLOTS:

//     //Function to get data based on year and location
//     //Doesn't work, but I think the idea of how it works is something along these lines
//     function organizeData (time, location) {
//         const object = {};
//         processedData.forEach(d => {
//             if (d.AREA_NAME == location && d.DATE_OCC == time) { //syntax likely not right for DATE_OCC, check how to only check certain parts of a string
//                 if (d.Area_Name in object) {
//                     object[d.AREA_NAME].count += 1;
//                 }
//                 else {
//                     const object = {
//                         area: d.Area,
//                         area_name: d.Area_Name,
//                         Date_OCC: d.DATE_OCC,
//                         count: 1,

    
//                         //Other Paramaters that will likely be organized by [more to be added]
//                         Vict_Age: d.Vict_Age,
//                         Vict_Sex: d.Vict_Sex 
    
//                     }
//                 }
//             }
//         })
//         return object;
//     }

//     //Bar Charts - Victim Age
//     //process data here, check which location is the one that should be used
//     //Processing data and amount for Victim Age
//     // var test = {};
//     // test = organizeData("2022", "Northeast"); //"02/16/2022 12:00:00 AM"
//     // console.log(test)


//     const victAgeCounts = processedData.reduce((s, { Vict_Age }) => (s[Vict_Age] = (s[Vict_Age] || 0) + 1, s), {});
//     const victAgeData = Object.keys(victAgeCounts).map((key) => ({ Vict_Age: key, count: victAgeCounts[key] }));
//     // console.log("victAgeData", victAgeData);

//     const barChartVicAge = svg.append("g")
//         .attr("width", barColumnWidth + barColumnMargin.left + barColumnMargin.right)
//         .attr("height", barColumnHeight + barColumnMargin.top + barColumnHeight.bottom)
//         .attr("transform", `translate(${barColumnMargin.left}, ${barColumnTop})`)

    
//     //Bar Charts - Victim Sex
//     const barChartVicSex = svg.append("g")
//         .attr("width", barColumnWidth + barColumnMargin.left + barColumnMargin.right)
//         .attr("height", barColumnHeight + barColumnMargin.top + barColumnHeight.bottom)
//         .attr("transform", `translate(${barColumnMargin.left}, ${barColumnTop})`)
//         //Likely add some multiplier to the width/heights/etc. to make sure the spacing is consitient, wait until they can show up to experiment
    
//     //Referenced HW3 for the Bar Charts [add more official looking reference later]
    
// //     }).catch(function(error) {
// //     console.log(error);
// // });

// // ///

// // }