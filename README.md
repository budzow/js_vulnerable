# Vulnerable JavaScript Application - SSRF Demonstration

This is an intentionally vulnerable Node.js Express application that demonstrates **Server-Side Request Forgery (SSRF)** vulnerabilities. The application is designed to trigger the `jssecurity:S5144` rule in static analysis tools.

⚠️ **WARNING**: This application contains intentional security vulnerabilities and should only be used for educational purposes in a controlled environment.

## Vulnerability Description

The application contains endpoints that accept user-provided URLs and make HTTP requests to them without proper validation. This allows attackers to:

- Access internal services and resources
- Scan internal networks
- Bypass firewalls and access controls
- Potentially access sensitive data from internal systems

## Vulnerable Endpoints

### 1. `/example` (GET)
```
GET /example?url=<target_url>
```
**Vulnerability**: Direct use of user-provided URL parameter without validation.

**Example malicious requests**:
```bash
# Access internal services
curl "http://localhost:3000/example?url=http://localhost:8080/admin"

# Access cloud metadata services (if running on cloud)
curl "http://localhost:3000/example?url=http://169.254.169.254/latest/meta-data/"

# Access file system (if supported)
curl "http://localhost:3000/example?url=file:///etc/passwd"
```

### 2. `/fetch-data` (POST)
```
POST /fetch-data
Content-Type: application/json

{
  "endpoint": "<target_url>"
}
```
**Vulnerability**: Uses URL from request body without validation.

**Example malicious request**:
```bash
curl -X POST http://localhost:3000/fetch-data \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "http://localhost:8080/internal-api"}'
```

## Safe Endpoint (for comparison)

### `/safe-example` (GET)
This endpoint demonstrates a safe implementation that uses a predefined URL instead of user input.

## Installation and Setup

1. Install dependencies:
```bash
npm install
```

2. Start the application:
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

3. Access the application at `http://localhost:3000`

## Static Analysis

This code should trigger the following security rule in static analysis tools:

- **Rule**: `jssecurity:S5144`
- **Title**: "Server-side requests should not be vulnerable to forging attacks"
- **Severity**: High
- **Type**: Vulnerability

## Mitigation Strategies

To fix these vulnerabilities:

1. **URL Validation**: Implement strict URL validation
2. **Allowlist**: Use a predefined list of allowed URLs/domains
3. **Network Segmentation**: Restrict outbound network access
4. **Input Sanitization**: Validate and sanitize all user inputs

### Example of Secure Implementation

```javascript
const allowedDomains = ['api.example.com', 'jsonplaceholder.typicode.com'];

app.get('/secure-example', async (req, res) => {
    const url = req.query.url;
    
    try {
        const parsedUrl = new URL(url);
        
        // Check if domain is in allowlist
        if (!allowedDomains.includes(parsedUrl.hostname)) {
            return res.status(400).json({ error: 'Domain not allowed' });
        }
        
        // Additional checks for internal networks
        if (parsedUrl.hostname.startsWith('192.168.') || 
            parsedUrl.hostname.startsWith('10.') || 
            parsedUrl.hostname === 'localhost' ||
            parsedUrl.hostname === '127.0.0.1') {
            return res.status(400).json({ error: 'Internal URLs not allowed' });
        }
        
        const response = await axios.get(url);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Request failed' });
    }
});
```

## Learning Resources

- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [PortSwigger SSRF Guide](https://portswigger.net/web-security/ssrf)

## Disclaimer

This application is for educational purposes only. Do not deploy this code to production environments or use it to test systems you do not own.
