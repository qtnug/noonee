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

async function run() {
  console.log('--- TESTING STRICT REVIEW RULES ---');

  // 1. Unordered user attempting to review
  const unorderedRes = await request('http://localhost:3000/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    productId: 9999,
    userId: 999999,
    customerName: 'Người Chưa Mua',
    rating: 5,
    comment: 'Món này nhìn ngon quá nhưng tôi chưa mua!',
  });
  console.log('1. Unordered user blocked:', unorderedRes.status === 403 ? '✅ Blocked 403: ' + unorderedRes.data.message : '❌ Failed: ' + unorderedRes.status);

  // 2. Fetch reviews with userId parameter
  const checkReq = await request('http://localhost:3000/api/reviews?productId=1&userId=999999');
  console.log('2. Check eligibility API:', checkReq.data?.success && checkReq.data.data.hasOrdered === false ? '✅ hasOrdered=false, userReview=null' : '❌ Failed');

  // 3. Create an order for user #1, then test first review + edit review
  const orderRes = await request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    userId: 1,
    customerName: 'Quản Trị Viên',
    customerPhone: '0988888888',
    deliveryAddress: '123 Đường Ẩm Thực',
    items: [{ productId: 1, productName: 'Phở Bò Đặc Biệt', price: 65000, quantity: 1 }],
  });

  if (orderRes.data?.success) {
    const orderCode = orderRes.data.data.orderCode;
    console.log(`3. Created order #${orderCode} for User #1`);

    // Submit first review
    const rev1 = await request('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      productId: 1,
      userId: 1,
      orderCode,
      customerName: 'Quản Trị Viên',
      rating: 5,
      comment: 'Lần đầu ăn thử phở bò, nước dùng rất đậm đà và nóng hổi!',
    });
    console.log('4. First review creation:', rev1.data?.success ? `✅ Success (isUpdate: ${rev1.data.isUpdate})` : '❌ Failed: ' + rev1.data?.message);

    // Submit second review for same item -> MUST UPDATE, NOT INSERT DUPLICATE
    const rev2 = await request('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      productId: 1,
      userId: 1,
      orderCode,
      customerName: 'Quản Trị Viên',
      rating: 4,
      comment: 'Cập nhật lại nhận xét: Bánh phở rất ngon nhưng quán cho hơi nhiều hành lá một chút.',
    });
    console.log('5. Edit review attempt:', rev2.data?.isUpdate === true ? `✅ Successfully updated existing review (Message: ${rev2.data.message})` : '❌ Failed');

    // Check that user review now has the updated comment
    const finalCheck = await request('http://localhost:3000/api/reviews?productId=1&userId=1');
    console.log('6. Verify updated review content:', finalCheck.data?.data?.userReview?.rating === 4 ? '✅ Confirmed rating is 4★ and updated' : '❌ Rating mismatch');
  }

  console.log('--- STRICT REVIEW RULES VERIFICATION FINISHED ---');
}

run().catch(console.error);
