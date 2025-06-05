import { initMap } from './heatmap.js';
import { loadCrimeData, filterCrimesByType } from './main.js';

async function createDashboard(selectedFilter = 'all') {
    const loading = document.getElementById("loading");
    try {
        
        loading.style.display = "block";
        const crimeData = await loadCrimeData();
        let filteredCrimeData = await filterCrimesByType(selectedFilter);

        filteredCrimeData = await loadCrimeData(filteredCrimeData);
        console.log(filteredCrimeData);

        // clear current map
        d3.select("#heatmap").selectAll("*").remove();
        d3.select("#overviewMap").selectAll("*").remove();

        const map = await initMap(filteredCrimeData);
        
    
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

