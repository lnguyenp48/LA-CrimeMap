import { initMap } from './heatmap.js';
import { loadCrimeData } from './main.js';

async function createDashboard() {
    try {
        
        const crimeData = await loadCrimeData();
       
        const map = await initMap(crimeData);

    
    } catch (error) {
        console.error("Failed to create dashboard:", error);
    }
}

createDashboard();
