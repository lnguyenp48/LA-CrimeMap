//rmbr to add getStartDate, getEndDate
import { initMap } from './heatmap.js';
import { loadCrimeData, filterCrimesByType, getLocationCounts, countCrimes } from './main.js';
import { drawTimeline, timelineDispatcher} from './timeline.js'
import { drawBarChart } from './barCharts.js';



const crimeData = await loadCrimeData();
const fullData = await d3.csv("Crime_Data_from_2020_to_Present.csv");
// drawTimeline() returns the currently selected time range
const defaultBrushSelection = await drawTimeline(fullData);
const defaultStartDate = defaultBrushSelection[0];
const defaultEndDate = defaultBrushSelection[1];

async function createDashboard(selectedFilter = 'all', startDate = defaultStartDate, endDate = defaultEndDate) {
    
    const loading = document.getElementById("loading");
    let title = "";
    if(selectedFilter == "all"){
        title = "All Crimes"
    }else if(selectedFilter == "battery_assault"){
        title = "Battery and Assault Cases";
    }else if(selectedFilter == "minors"){
        title = "Crimes Involving Minors";
    }else if(selectedFilter == "burglary_theft"){
        title = "Burglary and Theft Cases";
    }else{
        title = "Rape and Sexual Offenses";
    }
    document.getElementById("crimeType").textContent = title;

    try {
        
        loading.style.display = "block";

        let filteredCrimeData = await filterCrimesByType(selectedFilter, startDate, endDate);

        const crimeCount = await countCrimes();

        filteredCrimeData = await loadCrimeData(filteredCrimeData);
        getLocationCounts(filteredCrimeData);
        // console.log("Filtered crime data", filteredCrimeData);

        // Clear map to avoid previous maps from showing under newly rendered maps when user filters for a specific crime type
        d3.select("#heatmap").selectAll("*").remove();
        d3.select("#overviewMap").selectAll("*").remove();

        const map = await initMap(filteredCrimeData, fullData, crimeCount);
        const bar = await drawBarChart(filteredCrimeData);
    
    } catch (error) {
        console.error("Failed to create dashboard:", error);
    } finally {
        loading.style.display = "none";
    }
}

createDashboard();

document.getElementById("filterSelect").addEventListener("change", (e) => {
    createDashboard(e.target.value);
});

// Updates map when timeline is brushed over
timelineDispatcher.on("brushChanged", ([startDate, endDate]) => {
    const selectedFilter = document.getElementById("filterSelect").value;
    console.log("Filter:", selectedFilter, "\nNew time range:", startDate, "to", endDate);
    createDashboard(selectedFilter, startDate, endDate);
})