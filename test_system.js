// Automated System Integration & E2E Verification Script
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG NOONEE FOOD ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check & Database Connectivity
  try {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
    if (res.status === 200 && res.body.status === 'ok') {
      console.log('✅ [TEST 1] API /api/health: OK (Database Engine: ' + res.body.database.engine + ')');
      console.log('   -> Chi tiết CSDL:', res.body.database.details);
      passed++;
    } else {
      console.error('❌ [TEST 1] API /api/health thất bại:', res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ [TEST 1] Lỗi kết nối server:', err.message);
    failed++;
  }

  // Test 2: Categories API
  try {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/categories', method: 'GET' });
    if (res.status === 200 && res.body.success && res.body.data.length >= 4) {
      console.log('✅ [TEST 2] API /api/categories: OK (Số lượng danh mục: ' + res.body.data.length + ')');
      passed++;
    } else {
      console.error('❌ [TEST 2] API /api/categories thất bại:', res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ [TEST 2] Lỗi:', err.message);
    failed++;
  }

  // Test 3: Products API
  try {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/products', method: 'GET' });
    if (res.status === 200 && res.body.success && res.body.data.length >= 10) {
      console.log('✅ [TEST 3] API /api/products: OK (Số lượng món ăn: ' + res.body.data.length + ')');
      passed++;
    } else {
      console.error('❌ [TEST 3] API /api/products thất bại:', res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ [TEST 3] Lỗi:', err.message);
    failed++;
  }

  // Test 4: Customer Order Creation Flow
  let testOrderCode = '';
  try {
    const orderPayload = {
      customerName: 'Kiểm Thử Viên Tự Động',
      customerPhone: '0987654321',
      deliveryAddress: 'Số 10 Đường Công Nghệ, Q. Bình Thạnh',
      notes: 'Đơn test tự động kiểm thử hệ thống',
      paymentMethod: 'Sepay',
      items: [
        { productId: 1, productName: 'Phở Bò Đặc Biệt Hà Nội', price: 65000, quantity: 2 },
        { productId: 8, productName: 'Trà Đào Cam Sả Tươi Mát', price: 32000, quantity: 1 }
      ]
    };
    const res = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      orderPayload
    );
    if (res.status === 201 && res.body.success && res.body.data.orderCode) {
      testOrderCode = res.body.data.orderCode;
      console.log('✅ [TEST 4] Tạo đơn hàng mới thành công: Mã ' + testOrderCode + ', Tổng tiền: ' + res.body.data.totalAmount + 'đ');
      passed++;
    } else {
      console.error('❌ [TEST 4] Tạo đơn hàng thất bại:', res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ [TEST 4] Lỗi tạo đơn hàng:', err.message);
    failed++;
  }

  // Test 5: Lookup Order by Code
  if (testOrderCode) {
    try {
      const res = await request({ hostname: 'localhost', port: 3000, path: `/api/orders/${testOrderCode}`, method: 'GET' });
      if (res.status === 200 && res.body.success && res.body.data.orderCode === testOrderCode) {
        console.log('✅ [TEST 5] Tra cứu chi tiết đơn hàng #' + testOrderCode + ': OK (Status: ' + res.body.data.status + ', Payment: ' + res.body.data.paymentStatus + ')');
        passed++;
      } else {
        console.error('❌ [TEST 5] Tra cứu đơn hàng thất bại:', res.body);
        failed++;
      }
    } catch (err) {
      console.error('❌ [TEST 5] Lỗi tra cứu:', err.message);
      failed++;
    }
  }

  // Test 6: Sepay Payment Simulation / Webhook Confirmation
  if (testOrderCode) {
    try {
      const res = await request(
        {
          hostname: 'localhost',
          port: 3000,
          path: '/api/sepay/simulate',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        { orderCode: testOrderCode, amount: 162000 }
      );
      if (res.status === 200 && res.body.success) {
        console.log('✅ [TEST 6] Giả lập thanh toán Sepay (VietQR): OK (' + res.body.message + ')');
        passed++;
      } else {
        console.error('❌ [TEST 6] Giả lập thanh toán thất bại:', res.body);
        failed++;
      }
    } catch (err) {
      console.error('❌ [TEST 6] Lỗi Sepay simulate:', err.message);
      failed++;
    }
  }

  // Test 7: Verify Order Status Changed to Paid and Processing
  if (testOrderCode) {
    try {
      const res = await request({ hostname: 'localhost', port: 3000, path: `/api/orders/${testOrderCode}`, method: 'GET' });
      if (res.status === 200 && res.body.data.paymentStatus === 'Paid' && res.body.data.status === 'Processing') {
        console.log('✅ [TEST 7] Trạng thái đơn hàng sau thanh toán Sepay: OK (Status = Processing, Payment = Paid)');
        passed++;
      } else {
        console.error('❌ [TEST 7] Trạng thái đơn chưa cập nhật đúng:', res.body.data);
        failed++;
      }
    } catch (err) {
      console.error('❌ [TEST 7] Lỗi kiểm tra đơn sau thanh toán:', err.message);
      failed++;
    }
  }

  // Test 8: Admin Statistics API
  try {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/admin/stats', method: 'GET' });
    if (res.status === 200 && res.body.success && res.body.data.totalOrders >= 1) {
      console.log('✅ [TEST 8] API Admin Stats: OK (Doanh thu: ' + res.body.data.totalRevenue + 'đ, Số đơn: ' + res.body.data.totalOrders + ')');
      passed++;
    } else {
      console.error('❌ [TEST 8] API Admin Stats thất bại:', res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ [TEST 8] Lỗi admin stats:', err.message);
    failed++;
  }

  // Test 9: Auth API (Admin login)
  try {
    const res = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { username: 'admin', password: 'admin123' }
    );
    if (res.status === 200 && res.body.success && res.body.user.role === 'admin') {
      console.log('✅ [TEST 9] API Đăng nhập Admin (admin/admin123): OK (Role: admin)');
      passed++;
    } else {
      console.error('❌ [TEST 9] Đăng nhập Admin thất bại:', res.body);
      failed++;
    }
  } catch (err) {
    console.error('❌ [TEST 9] Lỗi auth login:', err.message);
    failed++;
  }

  console.log(`\n=== TỔNG KẾT KIỂM THỬ: ${passed}/9 BÀI TEST THÀNH CÔNG (${failed} lỗi) ===`);
  if (failed === 0) {
    console.log('🎉 TOÀN BỘ CHỨC NĂNG HOẠT ĐỘNG HOÀN HẢO!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
