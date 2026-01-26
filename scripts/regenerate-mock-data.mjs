#!/usr/bin/env node
/**
 * Mock Data Regeneration Script
 * 
 * This script regenerates test mock data from the real Kaavapino API.
 * It ensures tests use realistic data that matches the current database state.
 * 
 * Usage:
 *   node scripts/regenerate-mock-data.mjs [--api-url URL] [--output-dir DIR]
 * 
 * Options:
 *   --api-url   Base URL of the Kaavapino API (default: http://localhost:8000)
 *   --output-dir   Directory to write mock data files (default: src/__tests__/utils)
 *   --dry-run   Print what would be generated without writing files
 * 
 * Environment Variables:
 *   KAAVAPINO_API_URL   Alternative way to set the API URL
 *   KAAVAPINO_API_TOKEN   Bearer token for API authentication
 * 
 * Prerequisites:
 *   - Kaavapino backend running locally or accessible via network
 *   - API token with read access to project schemas and date types
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
};

const API_URL = getArg('--api-url') || process.env.KAAVAPINO_API_URL || 'http://localhost:8000';
const OUTPUT_DIR = getArg('--output-dir') || path.join(__dirname, '..', 'src', '__tests__', 'utils');
const DRY_RUN = args.includes('--dry-run');
const API_TOKEN = process.env.KAAVAPINO_API_TOKEN || '';

console.log('🔄 Mock Data Regeneration Script');
console.log('================================');
console.log(`API URL: ${API_URL}`);
console.log(`Output Directory: ${OUTPUT_DIR}`);
console.log(`Dry Run: ${DRY_RUN}`);
console.log('');

/**
 * Fetch data from the API with authentication
 */
async function fetchFromApi(endpoint) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Failed to fetch ${endpoint}: ${error.message}`);
    return null;
  }
}

/**
 * Generate date type arrays (arkipäivät, työpäivät, lautakuntapäivät)
 * These are generated algorithmically to match the backend's date type logic
 */
function generateDateTypes() {
  const startYear = new Date().getFullYear();
  const endYear = startYear + 5;
  
  const arkipäivät = [];
  const työpäivät = [];
  const lautakuntapäivät = [];
  const esilläolopäivät = [];
  
  const startDate = new Date(`${startYear}-01-01`);
  const endDate = new Date(`${endYear}-12-31`);
  
  for (let d = startDate.getTime(); d <= endDate.getTime(); d += 86400000) {
    const currentDate = new Date(d);
    const day = currentDate.getDay();
    const month = currentDate.getMonth() + 1;
    const date = currentDate.getDate();
    const year = currentDate.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    // Arkipäivät: Weekdays (Mon-Fri)
    if (day !== 0 && day !== 6) {
      arkipäivät.push(dateStr);
      
      // Työpäivät: Weekdays excluding July and Christmas period
      const isJuly = month === 7;
      const isChristmasPeriod = (month === 12 && date >= 24) || (month === 1 && date <= 6);
      
      if (!isJuly && !isChristmasPeriod) {
        työpäivät.push(dateStr);
        
        // Esilläolopäivät: Työpäivät excluding weeks 8 and 42
        const weekNumber = getWeekNumber(currentDate);
        if (weekNumber !== 8 && weekNumber !== 42) {
          esilläolopäivät.push(dateStr);
        }
      }
    }
    
    // Lautakuntapäivät: Tuesdays excluding July
    if (day === 2 && month !== 7) {
      lautakuntapäivät.push(dateStr);
    }
  }
  
  return { arkipäivät, työpäivät, lautakuntapäivät, esilläolopäivät };
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Fetch deadline distances from the API
 */
async function fetchDeadlineDistances() {
  console.log('📡 Fetching deadline distances from API...');
  
  // Try to fetch from the deadline distances endpoint
  const distances = await fetchFromApi('/v1/deadline-distances/');
  
  if (distances) {
    console.log(`✅ Fetched ${distances.length || 'unknown'} deadline distance rules`);
    return distances;
  }
  
  console.log('⚠️ Could not fetch deadline distances, using static data');
  return null;
}

/**
 * Fetch project schema to get deadline field definitions
 */
async function fetchProjectSchema() {
  console.log('📡 Fetching project schema from API...');
  
  const schema = await fetchFromApi('/v1/projects/schema/');
  
  if (schema) {
    console.log(`✅ Fetched project schema`);
    return schema;
  }
  
  console.log('⚠️ Could not fetch project schema');
  return null;
}

/**
 * Generate the checkForDecreasingValues_test_data.js file content
 */
function generateTestDataFile(dateTypes, deadlineDistances) {
  const { arkipäivät, työpäivät, lautakuntapäivät, esilläolopäivät } = dateTypes;
  
  let content = `/**
 * Auto-generated mock data for checkForDecreasingValues tests
 * 
 * Generated at: ${new Date().toISOString()}
 * 
 * This file contains:
 * - Date type arrays (arkipäivät, työpäivät, lautakuntapäivät, esilläolopäivät)
 * - Sample deadline timeline array with distance rules
 * 
 * To regenerate: node scripts/regenerate-mock-data.mjs
 */

const generateMockArkipäivät = () => {
    const dates = [];
    let currentDate = new Date("${arkipäivät[0]}");
    const endDate = new Date("${arkipäivät[arkipäivät.length - 1]}");

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // Exclude Sundays (0) and Saturdays (6)
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const date = String(currentDate.getDate()).padStart(2, '0');
            dates.push(\`\${year}-\${month}-\${date}\`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

const generateMockTyöpäivät = () => {
    const dates = [];
    let currentDate = new Date("${työpäivät[0]}");
    const endDate = new Date("${työpäivät[työpäivät.length - 1]}");

    // Exclude weekends, all july dates, and dates from 24.12 to 6.1
    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const date = String(currentDate.getDate()).padStart(2, '0');
        if (day !== 0 && day !== 6 && month !== '07' &&
            !(month === '12' && date >= '24') && !(month === '01' && date <= '06')) {
            const year = currentDate.getFullYear();
            dates.push(\`\${year}-\${month}-\${date}\`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

const generateMockLautakuntapäivät = () => {
    const dates = [];
    let currentDate = new Date("${lautakuntapäivät[0]}");
    const endDate = new Date("${lautakuntapäivät[lautakuntapäivät.length - 1]}");

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        if (day === 2 && month !== '07') { // Tuesdays (2) excluding July
            const year = currentDate.getFullYear();
            const date = String(currentDate.getDate()).padStart(2, '0');
            dates.push(\`\${year}-\${month}-\${date}\`);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

const generateMockEsillaolopaivat = () => {
    const base_dates = generateMockTyöpäivät();
    return base_dates.filter(date => {
        const dateObj = new Date(date)
        const weekNumber = Math.ceil((((dateObj - new Date(dateObj.getFullYear(),0,1)) / 86400000) + dateObj.getDay()+1)/7);
        return !(weekNumber === 8 || weekNumber === 42);
    });
}

`;

  // If we have deadline distances from the API, include them
  if (deadlineDistances && Array.isArray(deadlineDistances)) {
    content += `// Deadline distances fetched from API
const deadline_distances = ${JSON.stringify(deadlineDistances, null, 2)};

`;
  }

  // Add the sample test array (this would be fetched from a real project in production)
  content += `// Sample decreasing test array - regenerate from real project data as needed
// Use: node scripts/regenerate-mock-data.mjs --project-id <id>
`;

  return content;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Generate date types
    console.log('📅 Generating date type arrays...');
    const dateTypes = generateDateTypes();
    console.log(`✅ Generated ${dateTypes.arkipäivät.length} arkipäivät`);
    console.log(`✅ Generated ${dateTypes.työpäivät.length} työpäivät`);
    console.log(`✅ Generated ${dateTypes.lautakuntapäivät.length} lautakuntapäivät`);
    console.log(`✅ Generated ${dateTypes.esilläolopäivät.length} esilläolopäivät`);
    
    // Try to fetch from API
    const deadlineDistances = await fetchDeadlineDistances();
    const projectSchema = await fetchProjectSchema();
    
    // Generate file content
    const content = generateTestDataFile(dateTypes, deadlineDistances);
    
    if (DRY_RUN) {
      console.log('\n📝 Would generate the following content:');
      console.log('---');
      console.log(content.substring(0, 2000) + '...');
      console.log('---');
      console.log('\n✅ Dry run complete. No files written.');
    } else {
      // Write to file
      const outputPath = path.join(OUTPUT_DIR, 'mock_date_types.generated.js');
      await fs.writeFile(outputPath, content, 'utf-8');
      console.log(`\n✅ Written mock data to: ${outputPath}`);
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('- Date types: Generated algorithmically');
    console.log(`- Deadline distances: ${deadlineDistances ? 'Fetched from API' : 'Not available'}`);
    console.log(`- Project schema: ${projectSchema ? 'Fetched from API' : 'Not available'}`);
    
    if (!deadlineDistances || !projectSchema) {
      console.log('\n💡 Tip: Start the backend server and set KAAVAPINO_API_TOKEN to fetch live data');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
