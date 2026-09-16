import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify Cloudinary configuration
    const isConfigured = Boolean(
      process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET)
    );

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Chưa cấu hình Cloudinary trong .env.local. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (hoặc CLOUDINARY_URL).',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn 1 file hình ảnh để tải lên' },
        { status: 400 }
      );
    }

    // Check mime type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File tải lên phải là định dạng hình ảnh (JPG, PNG, WEBP, GIF...)' },
        { status: 400 }
      );
    }

    // Size limit check (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Dung lượng ảnh tối đa cho phép là 10MB' },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary stream
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'noonee_products',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Upload lên Cloudinary thất bại'));
            } else {
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          }
        );
        uploadStream.end(buffer);
      }
    );

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: 'Tải ảnh lên Cloudinary thành công!',
    });
  } catch (error: any) {
    console.error('Lỗi khi upload Cloudinary:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi xử lý và lưu trữ ảnh lên Cloud',
      },
      { status: 500 }
    );
  }
}
