import { initMap } from './heatmap.js';
import { loadCrimeData } from './main.js';
import { countCrimes } from './main.js';

async function createDashboard() {
    try {
        
        const crimeData = await loadCrimeData();

        const crimeCount = await countCrimes();
       
        const map = await initMap(crimeData, crimeCount);

    
    } catch (error) {
        console.error("Failed to create dashboard:", error);
    }
}

createDashboard();
