const http = require('http');

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING SYSTEM INTEGRATION VERIFICATION ---');

  // 1. Health check
  const health = await request('http://localhost:3000/api/health');
  console.log('1. Health Check:', health.data?.database?.connected ? '✅ Cloud DB Connected' : '❌ Failed', health.data?.database?.engine);

  // 2. Auth: Disallow random login
  const fakeLogin = await request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'non_existent_user_9999', password: 'WrongPassword123!' });
  console.log('2. Fake Login Blocked:', fakeLogin.status === 401 ? '✅ Correctly 401 Unauthorized' : `❌ Status: ${fakeLogin.status}`);

  // 3. Auth: Valid admin login
  const validLogin = await request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'admin', password: 'admin123' });
  console.log('3. Real SQL User Login:', validLogin.data?.success ? `✅ Logged in as ${validLogin.data.user.fullName} (Role: ${validLogin.data.user.role})` : '❌ Failed');

  // 4. Register validation
  const weakRegister = await request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'u', password: '123', confirmPassword: '321', fullName: 'Test', phone: '123' });
  console.log('4. Weak Registration Blocked:', weakRegister.status === 400 ? `✅ Blocked: ${weakRegister.data?.message}` : `❌ Status: ${weakRegister.status}`);

  // 5. User-isolated orders
  const ordersReq = await request('http://localhost:3000/api/orders?userId=1');
  console.log('5. Isolated User Orders:', ordersReq.data?.success ? `✅ Fetched ${ordersReq.data.data.length} orders for User #1` : '❌ Failed');

  // 6. Mandatory login for checkout
  const guestOrder = await request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { customerName: 'Guest', customerPhone: '0912345678', deliveryAddress: 'HN', items: [{ productId: 1, productName: 'Mì', price: 50000, quantity: 1 }] });
  console.log('6. Guest Order Blocked:', guestOrder.status === 401 ? '✅ Correctly required login (401)' : `❌ Status: ${guestOrder.status}`);

  // 7. Product reviews
  const reviewsReq = await request('http://localhost:3000/api/reviews?productId=1');
  console.log('7. Product Reviews:', reviewsReq.data?.success ? `✅ Reviews: ${reviewsReq.data.data.total} (Avg rating: ${reviewsReq.data.data.averageRating}★)` : '❌ Failed');

  // 8. Support / Complaint chat
  const supportReq = await request('http://localhost:3000/api/support');
  console.log('8. Support / Complaints:', supportReq.data?.success ? `✅ Loaded ${supportReq.data.data.length} support messages` : '❌ Failed');

  // 9. Admin Stats (Uncached force-dynamic)
  const adminStats = await request('http://localhost:3000/api/admin/stats');
  console.log('9. Admin Stats API:', adminStats.data?.success ? `✅ Revenue: ${adminStats.data.data.totalRevenue.toLocaleString()}đ, Total Orders: ${adminStats.data.data.totalOrders}` : '❌ Failed');

  console.log('--- ALL INTEGRATION CHECKS COMPLETED ---');
}

runTests().catch(console.error);
