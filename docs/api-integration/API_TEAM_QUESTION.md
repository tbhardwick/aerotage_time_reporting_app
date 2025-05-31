# API Team Question: Project Creation Endpoint Schema

## Issue Summary
We're implementing the frontend integration for the **Project Creation** endpoint (`POST /projects`) but are encountering validation errors despite multiple attempts to match the expected schema.

## Current Status
- ✅ **Client Creation** (`POST /clients`) - **Working perfectly**
- ❌ **Project Creation** (`POST /projects`) - **Failing with validation errors**

## Error Details

### Error Message
```
Client ID is required and must be a string, Client name is required and must be a string
```

### HTTP Response
```
POST https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev/projects
Status: 400 (Bad Request)

Response Body:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Client ID is required and must be a string, Client name is required and must be a string"
  },
  "timestamp": "2025-05-27T15:20:57.867Z"
}
```

## Working Example (Client Creation)
For reference, here's the **working** client creation payload:

```json
POST /clients
{
  "name": "Test Client 1748359087339",
  "contactInfo": {
    "email": "test@example.com",
    "phone": "555-0123"
  },
  "isActive": true
}
```
**Result**: ✅ **Success** - Returns 201 with created client data

## Failed Attempts (Project Creation)

### Attempt 1: Direct Field Mapping
```json
POST /projects
{
  "clientId": "client-id-here",
  "clientName": "client-name-here", 
  "name": "Test Project 1748359087339",
  "description": "API Integration Test Project",
  "hourlyRate": 100,
  "status": "active",
  "isActive": true,
  "defaultBillable": true,
  "teamMembers": [],
  "tags": []
}
```
**Result**: ❌ **Failed** - Same validation error

### Attempt 2: Exact Error Field Names
```json
POST /projects
{
  "Client ID": "client-id-here",
  "Client name": "client-name-here",
  "clientId": "client-id-here",
  "clientName": "client-name-here",
  "name": "Test Project 1748359087339",
  "description": "API Integration Test Project",
  "hourlyRate": 100,
  "status": "active",
  "isActive": true,
  "defaultBillable": true,
  "teamMembers": [],
  "tags": []
}
```
**Result**: ❌ **Failed** - Same validation error

### Attempt 3: Nested Client Object
```json
POST /projects
{
  "client": {
    "id": "client-id-here",
    "name": "client-name-here"
  },
  "name": "Test Project 1748359087339",
  "description": "API Integration Test Project",
  "hourlyRate": 100,
  "status": "active",
  "isActive": true,
  "defaultBillable": true,
  "teamMembers": [],
  "tags": []
}
```
**Result**: ❌ **Failed** - Same validation error

## Questions for API Team

### 1. **Exact Schema Request**
Could you please provide the **exact request body schema** for the `POST /projects` endpoint?

### 2. **Working Example**
Could you share a **working example** of a successful project creation request payload?

### 3. **Client Reference Format**
How should the client be referenced in the project creation request?
- Direct fields: `clientId`, `clientName`?
- Nested object: `client: { id, name }`?
- Different field names entirely?

### 4. **Required vs Optional Fields**
Which fields are **required** vs **optional** for project creation?

### 5. **Field Name Clarification**
The error mentions "Client ID" and "Client name" (with spaces and capitals). Are these the exact field names expected, or is this just the error message formatting?

### 6. **API Documentation**
Is there updated API documentation that shows the current schema for the projects endpoint?

## Additional Context

- **Environment**: Development (`https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev/`)
- **Authentication**: Working (JWT token in Authorization header)
- **User**: `bhardwick@aerotage.com` (0408a498-40c1-7071-acc9-90665ef117c3)
- **Other Endpoints**: All other endpoints (clients, time-entries, users, etc.) are working correctly

## Request
Please provide the correct schema so we can complete the frontend integration. We've tried multiple approaches but clearly need the authoritative schema from the backend team.

Thank you!

---
**Frontend Team**  
**Date**: May 27, 2025 