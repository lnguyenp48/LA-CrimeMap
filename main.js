// boundaries and margin setup
const width = window.innerWidth;
const height = window.innerHeight;

// TODO: margins for each section here


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

    // TODO: data parsing (as needed)

    // create svg
    const svg = d3.select("svg"); 

    // MAP PLOT:

    // TIMELINE SCROLLING:

    // ADDITIONAL PLOTS:

    // ALLUVIAL PLOT:

    
    }).catch(function(error) {
    console.log(error);
});

///