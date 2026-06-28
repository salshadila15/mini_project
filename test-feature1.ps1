#!/usr/bin/env pwsh

Write-Host "========== Testing Feature 1: Event Discovery ==========" -ForegroundColor Cyan

$baseUrl = "http://localhost:8000"

# Test 1: Get categories
Write-Host "`n[TEST 1] Get Event Categories" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/events/filters/categories" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Categories found: $($data.data.Count)" -ForegroundColor Green
    if ($data.data.Count -gt 0) {
        Write-Host "Sample categories: $($data.data[0..2] -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 2: Get locations
Write-Host "`n[TEST 2] Get Event Locations" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/events/filters/locations" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Locations found: $($data.data.Count)" -ForegroundColor Green
    if ($data.data.Count -gt 0) {
        Write-Host "Sample locations: $($data.data[0..2] -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 3: Get public events (no filters)
Write-Host "`n[TEST 3] Get Public Events (page 1)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/events?page=1&limit=5" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Total events: $($data.data.pagination.total)" -ForegroundColor Green
    Write-Host "Events on page: $($data.data.events.Count)" -ForegroundColor Green
    Write-Host "Pagination: Page $($data.data.pagination.page)/$($data.data.pagination.totalPages)" -ForegroundColor Gray
    
    if ($data.data.events.Count -gt 0) {
        Write-Host "`nFirst event details:" -ForegroundColor Cyan
        $evt = $data.data.events[0]
        Write-Host "  ID: $($evt.id)"
        Write-Host "  Name: $($evt.name)"
        Write-Host "  Date: $($evt.date)"
        Write-Host "  Price: IDR $($evt.price)"
        Write-Host "  Category: $($evt.category)"
        Write-Host "  Location: $($evt.location)"
        Write-Host "  Available Seats: $($evt.availableSeats)"
        Write-Host "  Organizer: $($evt.organizer.name)"
    } else {
        Write-Host "No events found - this is OK if DB is empty" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 4: Get public events with search filter
Write-Host "`n[TEST 4] Get Public Events with Search Filter" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/events?search=tech&page=1&limit=5" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Search results: $($data.data.events.Count) events found" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 5: Get public events with category filter
Write-Host "`n[TEST 5] Get Public Events with Category Filter" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/events?category=Tech&page=1&limit=5" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Category filter results: $($data.data.events.Count) events found" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 6: Get public events with location filter
Write-Host "`n[TEST 6] Get Public Events with Location Filter" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/events?location=Jakarta&page=1&limit=5" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Location filter results: $($data.data.events.Count) events found" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n========== Feature 1 Testing Complete ==========" -ForegroundColor Cyan
Write-Host "Frontend available at: http://localhost:5175" -ForegroundColor Cyan
Write-Host "Backend API at: http://localhost:8000" -ForegroundColor Cyan
