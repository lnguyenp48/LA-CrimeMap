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
// This function filters the original crime dataset based on the locatino type of crime committed
// district: district to filter data
// returns set with all location types + crime count 
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

// This function returns a set of areas + crime count for that area
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
