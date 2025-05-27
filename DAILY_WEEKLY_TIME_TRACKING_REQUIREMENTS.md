# Daily and Weekly Time Tracking - Backend API Requirements

## Overview
Enhance the time tracking system to provide users with daily and weekly views that help them account for all their work time during the work week. This addresses the common need for users to review their time allocation and identify gaps in their time tracking.

## Current State Analysis
- ✅ Basic time entry CRUD operations exist
- ✅ Time entries have date, duration, project association
- ✅ Basic filtering by date range, project, status
- ❌ No daily/weekly aggregation endpoints
- ❌ No time gap analysis
- ❌ No work schedule/target hours tracking
- ❌ No daily summary calculations

## Required API Enhancements

### 1. Daily Time Summary Endpoint
**Endpoint:** `GET /time-entries/daily-summary`

**Purpose:** Get aggregated time data for specific days with gap analysis

**Query Parameters:**
```
- startDate: string (YYYY-MM-DD, required)
- endDate: string (YYYY-MM-DD, required) 
- userId: string (optional, defaults to current user)
- includeGaps: boolean (optional, default: true)
- targetHours: number (optional, default: 8)
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "date": "2024-01-15",
        "dayOfWeek": "Monday",
        "totalMinutes": 480,
        "totalHours": 8.0,
        "billableMinutes": 420,
        "billableHours": 7.0,
        "nonBillableMinutes": 60,
        "nonBillableHours": 1.0,
        "targetMinutes": 480,
        "targetHours": 8.0,
        "completionPercentage": 100.0,
        "entriesCount": 5,
        "projectBreakdown": [
          {
            "projectId": "proj_123",
            "projectName": "Website Redesign",
            "clientName": "Acme Corp",
            "minutes": 240,
            "hours": 4.0,
            "percentage": 50.0
          }
        ],
        "timeGaps": [
          {
            "startTime": "10:00",
            "endTime": "10:30",
            "durationMinutes": 30,
            "suggestedAction": "break"
          }
        ],
        "workingHours": {
          "firstEntry": "08:00",
          "lastEntry": "17:30",
          "totalSpan": "9h 30m"
        }
      }
    ],
    "periodSummary": {
      "totalDays": 5,
      "workDays": 5,
      "totalHours": 38.5,
      "averageHoursPerDay": 7.7,
      "targetHours": 40.0,
      "completionPercentage": 96.25
    }
  }
}
```

### 2. Weekly Time Overview Endpoint
**Endpoint:** `GET /time-entries/weekly-overview`

**Purpose:** Get comprehensive weekly time analysis with patterns and trends

**Query Parameters:**
```
- weekStartDate: string (YYYY-MM-DD, Monday of the week)
- userId: string (optional, defaults to current user)
- includeComparison: boolean (optional, compare with previous week)
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "weekInfo": {
      "weekStartDate": "2024-01-15",
      "weekEndDate": "2024-01-19",
      "weekNumber": 3,
      "year": 2024
    },
    "dailySummaries": [
      {
        "date": "2024-01-15",
        "dayOfWeek": "Monday",
        "totalHours": 8.0,
        "billableHours": 7.0,
        "entriesCount": 5,
        "completionPercentage": 100.0
      }
    ],
    "weeklyTotals": {
      "totalHours": 38.5,
      "billableHours": 35.0,
      "nonBillableHours": 3.5,
      "targetHours": 40.0,
      "completionPercentage": 96.25,
      "totalEntries": 23
    },
    "patterns": {
      "mostProductiveDay": "Tuesday",
      "leastProductiveDay": "Friday", 
      "averageStartTime": "08:15",
      "averageEndTime": "17:30",
      "longestWorkDay": "Tuesday",
      "shortestWorkDay": "Friday"
    },
    "projectDistribution": [
      {
        "projectId": "proj_123",
        "projectName": "Website Redesign",
        "clientName": "Acme Corp",
        "totalHours": 20.0,
        "percentage": 51.9,
        "dailyBreakdown": [
          {
            "date": "2024-01-15",
            "hours": 4.0
          }
        ]
      }
    ],
    "comparison": {
      "previousWeek": {
        "totalHours": 35.0,
        "change": "+3.5",
        "changePercentage": "+10.0%"
      }
    }
  }
}
```

### 3. Time Gap Analysis Endpoint
**Endpoint:** `GET /time-entries/gap-analysis`

**Purpose:** Identify periods during work days where no time was tracked

**Query Parameters:**
```
- date: string (YYYY-MM-DD, required)
- userId: string (optional, defaults to current user)
- workStartTime: string (HH:MM, optional, default: "08:00")
- workEndTime: string (HH:MM, optional, default: "17:00")
- minimumGapMinutes: number (optional, default: 15)
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "workingHours": {
      "start": "08:00",
      "end": "17:00",
      "totalMinutes": 540
    },
    "trackedTime": {
      "totalMinutes": 450,
      "percentage": 83.3
    },
    "gaps": [
      {
        "startTime": "10:00",
        "endTime": "10:30", 
        "durationMinutes": 30,
        "type": "untracked",
        "suggestions": [
          {
            "action": "add_break",
            "description": "Add break time"
          },
          {
            "action": "extend_previous",
            "description": "Extend previous task",
            "entryId": "te_123"
          }
        ]
      }
    ],
    "recommendations": [
      {
        "type": "fill_gap",
        "message": "You have 1.5 hours of untracked time today",
        "action": "Consider adding time entries for missing periods"
      }
    ]
  }
}
```

### 4. Quick Time Entry Endpoint
**Endpoint:** `POST /time-entries/quick-add`

**Purpose:** Simplified time entry creation for filling gaps

**Request Body:**
```json
{
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "10:30",
  "projectId": "proj_123",
  "description": "Coffee break",
  "isBillable": false,
  "fillGap": true
}
```

**Response:** Standard time entry creation response

### 5. User Work Schedule Endpoint
**Endpoint:** `GET /users/work-schedule`
**Endpoint:** `PUT /users/work-schedule`

**Purpose:** Manage user's work schedule for accurate gap analysis

**GET Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "schedule": {
      "monday": { "start": "08:00", "end": "17:00", "targetHours": 8 },
      "tuesday": { "start": "08:00", "end": "17:00", "targetHours": 8 },
      "wednesday": { "start": "08:00", "end": "17:00", "targetHours": 8 },
      "thursday": { "start": "08:00", "end": "17:00", "targetHours": 8 },
      "friday": { "start": "08:00", "end": "16:00", "targetHours": 7 },
      "saturday": { "start": null, "end": null, "targetHours": 0 },
      "sunday": { "start": null, "end": null, "targetHours": 0 }
    },
    "timezone": "America/New_York",
    "weeklyTargetHours": 39
  }
}
```

**PUT Request Body:**
```json
{
  "schedule": {
    "monday": { "start": "09:00", "end": "18:00", "targetHours": 8 }
  },
  "timezone": "America/New_York"
}
```

## Database Schema Changes

### 1. User Work Schedule Table
```sql
CREATE TABLE user_work_schedules (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
  start_time TIME,
  end_time TIME,
  target_hours DECIMAL(4,2),
  is_working_day BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_day (user_id, day_of_week)
);
```

### 2. Time Entry Enhancements
```sql
-- Add columns to existing time_entries table
ALTER TABLE time_entries 
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN auto_generated BOOLEAN DEFAULT false,
ADD COLUMN gap_filler BOOLEAN DEFAULT false;

-- Index for efficient date-based queries
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_date_time ON time_entries(date, start_time, end_time);
```

## Implementation Priority

### Phase 1: Core Daily Summary (Week 1)
- [ ] Daily summary endpoint with basic aggregation
- [ ] Time gap identification logic
- [ ] User work schedule CRUD operations

### Phase 2: Weekly Overview (Week 2)  
- [ ] Weekly overview endpoint
- [ ] Pattern analysis algorithms
- [ ] Project distribution calculations

### Phase 3: Advanced Features (Week 3)
- [ ] Quick time entry endpoint
- [ ] Gap filling suggestions
- [ ] Comparison with previous periods

### Phase 4: Optimization (Week 4)
- [ ] Performance optimization for large datasets
- [ ] Caching for frequently accessed summaries
- [ ] Real-time updates via WebSocket (optional)

## Technical Considerations

### Performance
- Use database aggregation functions for calculations
- Implement caching for daily/weekly summaries
- Add pagination for large date ranges
- Consider materialized views for complex calculations

### Data Integrity
- Validate time ranges don't overlap
- Ensure start_time < end_time
- Handle timezone conversions properly
- Validate work schedule constraints

### Security
- Ensure users can only access their own data (unless admin)
- Validate date ranges to prevent excessive queries
- Rate limit gap analysis requests

### Error Handling
- Handle missing work schedule gracefully
- Provide meaningful error messages for invalid date ranges
- Handle edge cases (holidays, partial days, etc.)

## Testing Requirements

### Unit Tests
- [ ] Daily summary calculations
- [ ] Gap analysis algorithms  
- [ ] Work schedule validation
- [ ] Time overlap detection

### Integration Tests
- [ ] End-to-end daily summary flow
- [ ] Weekly overview with real data
- [ ] Gap analysis with various scenarios
- [ ] Quick time entry creation

### Performance Tests
- [ ] Large dataset handling (1000+ entries)
- [ ] Concurrent user requests
- [ ] Complex date range queries

## Documentation Updates

### API Documentation
- [ ] Update OpenAPI specification
- [ ] Add example requests/responses
- [ ] Document error codes and messages

### User Documentation
- [ ] Daily/weekly view usage guide
- [ ] Work schedule configuration
- [ ] Gap analysis interpretation

## Success Metrics

### User Experience
- Reduce time spent on manual time tracking by 30%
- Increase time tracking accuracy by 25%
- Improve user satisfaction with time accountability

### Technical Performance
- API response times < 500ms for daily summaries
- Support 100+ concurrent users
- 99.9% uptime for time tracking endpoints

### Business Value
- Increase billable hour accuracy by 20%
- Reduce time tracking administrative overhead
- Improve project time estimation accuracy 