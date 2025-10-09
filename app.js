const axios = require('axios');
const express = require('express');
const { fetchExternalData, proxyRequest } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Vulnerable endpoint that demonstrates SSRF vulnerability
// This triggers jssecurity:S5144 rule
app.get('/example', async (req, res) => {
    try {
        // VULNERABLE: Direct use of user-provided URL without validation
        // This allows attackers to make requests to internal services
        await axios.get(req.query.url); // Noncompliant - jssecurity:S5144
        res.send("OK");
    } catch (err) {
        console.error(err);
        res.send("ERROR");
    }
});

// Additional vulnerable endpoints for demonstration 
app.post('/fetch-data', async (req, res) => {
    try {
        // VULNERABLE: Another SSRF example with POST body
        const response = await axios.get(req.body.endpoint); // Noncompliant - jssecurity:S5144
        res.json({ 
            status: 'success', 
            data: response.data 
        });
    } catch (err) {
        console.error('Error fetching data:', err.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch data' 
        });
    }
});

// New vulnerable endpoint using utility function
app.get('/proxy', async (req, res) => {
    try {
        // VULNERABLE: Uses utility function that creates SSRF vulnerability
        // This creates a data flow from user input to vulnerable axios call in utils.js
        const result = await fetchExternalData(req.query.target); // Data flow starts here
        res.json(result);
    } catch (err) {
        console.error('Error in proxy endpoint:', err.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Proxy request failed' 
        });
    }
});

// Safe endpoint example (for comparison)
app.get('/safe-example', async (req, res) => {
    try {
        // SAFE: Using a predefined, validated URL
        const safeUrl = 'https://jsonplaceholder.typicode.com/posts/1';
        const response = await axios.get(safeUrl);
        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR");
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint with usage instructions
app.get('/', (req, res) => {
    res.json({
        message: 'Vulnerable JS App - SSRF Demonstration',
        endpoints: {
            '/example?url=<URL>': 'Vulnerable SSRF endpoint (GET)',
            '/fetch-data': 'Vulnerable SSRF endpoint (POST with JSON body: {"endpoint": "<URL>"})',
            '/proxy?target=<URL>': 'Vulnerable SSRF endpoint using utility function (GET)',
            '/safe-example': 'Safe endpoint example',
            '/health': 'Health check'
        },
        warning: 'This application contains intentional security vulnerabilities for educational purposes only!'
    });
});

app.listen(PORT, () => {
    console.log(`🚨 Vulnerable JS App running on port ${PORT}`);
    console.log(`⚠️  WARNING: This application contains intentional SSRF vulnerabilities!`);
    console.log(`📖 Access http://localhost:${PORT} for usage instructions`);
});
