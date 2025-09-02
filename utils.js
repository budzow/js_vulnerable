const axios = require('axios');

/**
 * Utility functions for the vulnerable application
 * This file contains additional SSRF vulnerabilities for demonstration
 */

/**
 * Fetches data from a URL - VULNERABLE IMPLEMENTATION
 * This function demonstrates another SSRF vulnerability pattern
 * @param {string} url - User-provided URL
 * @returns {Promise} Response data
 */
async function fetchExternalData(url) {
    try {
        // VULNERABLE: Direct use of user-provided URL without validation
        // This creates another SSRF vulnerability point
        const response = await axios.get(url); // Noncompliant - jssecurity:S5144
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        console.error('Error in fetchExternalData:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Proxy function to make HTTP requests - VULNERABLE IMPLEMENTATION
 * @param {Object} config - Request configuration
 * @returns {Promise} Response data
 */
async function proxyRequest(config) {
    try {
        // VULNERABLE: Using user-provided configuration without validation
        // This allows SSRF attacks through the config object
        const response = await axios(config); // Noncompliant - jssecurity:S5144
        return response.data;
    } catch (error) {
        throw new Error(`Proxy request failed: ${error.message}`);
    }
}

/**
 * Health check for external services - SAFE IMPLEMENTATION (for comparison)
 * @returns {Promise} Health status
 */
async function checkServiceHealth() {
    try {
        // SAFE: Using predefined, validated URLs
        const healthEndpoints = [
            'https://jsonplaceholder.typicode.com/posts/1',
            'https://httpbin.org/status/200'
        ];
        
        const results = await Promise.all(
            healthEndpoints.map(async (url) => {
                try {
                    const response = await axios.get(url, { timeout: 5000 });
                    return { url, status: 'healthy', code: response.status };
                } catch (error) {
                    return { url, status: 'unhealthy', error: error.message };
                }
            })
        );
        
        return results;
    } catch (error) {
        console.error('Health check failed:', error);
        return [];
    }
}

/**
 * Download file from URL - VULNERABLE IMPLEMENTATION
 * @param {string} fileUrl - User-provided file URL
 * @param {string} destination - Local destination path
 */
async function downloadFile(fileUrl, destination) {
    try {
        // VULNERABLE: Direct use of user-provided URL for file download
        // This could be used for SSRF attacks or accessing internal files
        const response = await axios.get(fileUrl, { 
            responseType: 'stream',
            timeout: 30000
        }); // Noncompliant - jssecurity:S5144
        
        console.log(`File downloaded from ${fileUrl} to ${destination}`);
        return response;
    } catch (error) {
        console.error(`Download failed for ${fileUrl}:`, error.message);
        throw error;
    }
}

module.exports = {
    fetchExternalData,
    proxyRequest,
    checkServiceHealth,
    downloadFile
};
