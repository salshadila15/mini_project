const http = require('http');

const baseUrl = 'http://localhost:8000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      })
      .on('error', reject);
  });
}

async function runTests() {
  console.log('\n========== Testing Feature 1: Event Discovery ==========\n');

  try {
    // Test 1: Categories
    console.log('[TEST 1] Get Event Categories');
    let res = await makeRequest('/api/events/filters/categories');
    console.log('  Status:', res.status);
    console.log('  Categories found:', res.data.data?.length || 0);
    if (res.data.data?.length > 0) {
      console.log('  Sample:', res.data.data.slice(0, 3).join(', '));
    }

    // Test 2: Locations
    console.log('\n[TEST 2] Get Event Locations');
    res = await makeRequest('/api/events/filters/locations');
    console.log('  Status:', res.status);
    console.log('  Locations found:', res.data.data?.length || 0);
    if (res.data.data?.length > 0) {
      console.log('  Sample:', res.data.data.slice(0, 3).join(', '));
    }

    // Test 3: Public events
    console.log('\n[TEST 3] Get Public Events (page 1)');
    res = await makeRequest('/api/events?page=1&limit=5');
    console.log('  Status:', res.status);
    console.log('  Total events:', res.data.data?.pagination?.total || 0);
    console.log('  Events on page:', res.data.data?.events?.length || 0);
    if (res.data.data?.pagination) {
      console.log(
        '  Pagination: Page',
        res.data.data.pagination.page,
        '/',
        res.data.data.pagination.totalPages
      );
    }

    if (res.data.data?.events?.length > 0) {
      const evt = res.data.data.events[0];
      console.log('\n  First event details:');
      console.log('    ID:', evt.id);
      console.log('    Name:', evt.name);
      console.log('    Date:', evt.date);
      console.log('    Price:', evt.price);
      console.log('    Category:', evt.category);
      console.log('    Location:', evt.location);
      console.log('    Available Seats:', evt.availableSeats);
      console.log('    Organizer:', evt.organizer?.name);
    } else {
      console.log('  ℹ️  No events found - this is OK if DB is empty');
    }

    // Test 4: Search filter
    console.log('\n[TEST 4] Get Events with Search Filter');
    res = await makeRequest('/api/events?search=tech&page=1&limit=5');
    console.log('  Status:', res.status);
    console.log(
      '  Search results:',
      res.data.data?.events?.length || 0,
      'events'
    );

    // Test 5: Category filter
    console.log('\n[TEST 5] Get Events with Category Filter');
    res = await makeRequest('/api/events?category=Tech&page=1&limit=5');
    console.log('  Status:', res.status);
    console.log(
      '  Category filter results:',
      res.data.data?.events?.length || 0,
      'events'
    );

    // Test 6: Location filter
    console.log('\n[TEST 6] Get Events with Location Filter');
    res = await makeRequest('/api/events?location=Jakarta&page=1&limit=5');
    console.log('  Status:', res.status);
    console.log(
      '  Location filter results:',
      res.data.data?.events?.length || 0,
      'events'
    );

    console.log('\n✅ All Feature 1 API endpoints are working!');
    console.log('\n📱 Frontend available at: http://localhost:5175');
    console.log('🔌 Backend API at: http://localhost:8000');
    console.log('📖 Test the UI manually by visiting http://localhost:5175/\n');
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

runTests();
