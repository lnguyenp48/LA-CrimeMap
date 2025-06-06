//rmbr to add getStartDate, getEndDate
import { initMap, getStartDate, getEndDate } from './heatmap.js';
import { loadCrimeData, filterCrimesByType, countCrimes } from './main.js';


async function createDashboard(selectedFilter = 'all') {
    const loading = document.getElementById("loading");
    try {
        
        loading.style.display = "block";

        const crimeData = await loadCrimeData();

        const fullData = await d3.csv("Crime_Data_from_2020_to_Present.csv");

        // get time range 
        const startDate = getStartDate();
        const endDate = getEndDate();
        // const startDate ="01/01/2022 12:00:00 AM";
        // const endDate = "02/01/2022 12:00:00 AM";

        let filteredCrimeData = await filterCrimesByType(selectedFilter, startDate, endDate);

        const crimeCount = await countCrimes();

        filteredCrimeData = await loadCrimeData(filteredCrimeData);
        console.log(filteredCrimeData);

        // Clear map to avoid previous maps from showing under newly rendered maps when user filters for a specific crime type
        d3.select("#heatmap").selectAll("*").remove();
        d3.select("#overviewMap").selectAll("*").remove();

        const map = await initMap(filteredCrimeData, fullData, crimeCount);
        
    
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

