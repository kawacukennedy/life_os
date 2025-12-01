import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 500 }, // Ramp up to 500 users over 2 minutes
    { duration: '5m', target: 500 }, // Stay at 500 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],   // Error rate should be below 10%
    errors: ['rate<0.1'],            // Custom error rate
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

let authTokens = [];

export function setup() {
  // Setup phase - create test users and get auth tokens
  console.log('Setting up test data...');

  for (const user of testUsers) {
    const registerResponse = http.post(`${BASE_URL}/auth/signup`, {
      email: user.email,
      password: user.password,
      firstName: 'Test',
      lastName: 'User',
    });

    if (registerResponse.status === 201 || registerResponse.status === 409) {
      // User created or already exists
      const loginResponse = http.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password,
      });

      if (loginResponse.status === 200) {
        const responseBody = JSON.parse(loginResponse.body);
        authTokens.push(responseBody.accessToken);
      }
    }
  }

  console.log(`Setup complete. Got ${authTokens.length} auth tokens.`);
  return { authTokens };
}

export default function (data) {
  const token = data.authTokens[Math.floor(Math.random() * data.authTokens.length)];

  // Test authentication endpoints
  const loginResponse = http.post(`${BASE_URL}/auth/login`, {
    email: testUsers[0].email,
    password: testUsers[0].password,
  });

  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(loginResponse.status !== 200);
  responseTimeTrend.add(loginResponse.timings.duration);

  // Test protected endpoints with authentication
  if (token) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test user profile endpoint
    const profileResponse = http.get(`${BASE_URL}/auth/profile`, { headers });

    check(profileResponse, {
      'profile status is 200': (r) => r.status === 200,
      'profile response time < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(profileResponse.status !== 200);
    responseTimeTrend.add(profileResponse.timings.duration);

    // Test dashboard data endpoint (if exists)
    const dashboardResponse = http.get(`${BASE_URL}/auth/dashboard`, { headers });

    check(dashboardResponse, {
      'dashboard status is 200 or 404': (r) => [200, 404].includes(r.status),
      'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(![200, 404].includes(dashboardResponse.status));
    responseTimeTrend.add(dashboardResponse.timings.duration);

    // Simulate user activity patterns
    const activityType = Math.random();

    if (activityType < 0.3) {
      // 30% - Update profile
      const updateResponse = http.put(`${BASE_URL}/auth/profile`, JSON.stringify({
        firstName: 'Updated',
        lastName: 'Name',
      }), { headers });

      check(updateResponse, {
        'update profile status is 200': (r) => r.status === 200,
      });

      errorRate.add(updateResponse.status !== 200);
    } else if (activityType < 0.6) {
      // 30% - Get settings
      const settingsResponse = http.get(`${BASE_URL}/auth/settings`, { headers });

      check(settingsResponse, {
        'settings status is 200 or 404': (r) => [200, 404].includes(r.status),
      });

      errorRate.add(![200, 404].includes(settingsResponse.status));
    } else {
      // 40% - Password change attempt (will fail but tests rate limiting)
      const changePasswordResponse = http.post(`${BASE_URL}/auth/change-password`, JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      }), { headers });

      check(changePasswordResponse, {
        'change password status is 400 or 429': (r) => [400, 429].includes(r.status),
      });

      errorRate.add(![400, 429].includes(changePasswordResponse.status));
    }
  }

  // Random sleep between 1-5 seconds to simulate real user behavior
  sleep(Math.random() * 4 + 1);
}

export function teardown(data) {
  console.log('Load test completed. Cleaning up...');

  // Cleanup test data if needed
  // Note: In production, you might want to keep test data or have a separate cleanup script
}