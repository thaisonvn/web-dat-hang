import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from './types';

export const INITIAL_PRODUCTS: Partial<Product>[] = [
  {
    name: 'Dầu gan cá mập Orihiro Squalene Nhật Bản (Chai 360 viên)',
    category: 'Thực phẩm chức năng',
    price: 689075,
    description: 'Giúp chống oxy hóa, hỗ trợ các hoạt động của mắt, Hỗ trợ tim mạch khỏe mạnh, Tốt cho da và tóc. Uống 6 viên chia 2 lần, với bữa ăn hoặc sau ăn.',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Nhỏ mắt Rohto 40α xanh',
    category: 'Thực phẩm chức năng',
    price: 74790,
    description: 'Chống ngứa mắt, chống mệt mỏi mắt',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Nhỏ mắt Rohto 40α vàng',
    category: 'Thực phẩm chức năng',
    price: 74790,
    description: 'Bổ sung vitamin, giảm mỏi mắt',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Kaminomoto A Không Mùi (hỗ trợ điều trị rụng tóc và kích thích mọc tóc) 150ml',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 462090,
    description: 'Giảm rụng tóc, kích thích mọc tóc, cải thiện sức khỏe da đầu.',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Viên uống bổ xương khớp Zs Chondroitin 1560mg 270 viên',
    category: 'Thực phẩm chức năng',
    price: 1793775,
    description: 'Đau khớp, đau dây thần kinh, đau lưng... Uống 2 viên mỗi lần, ngày 3 lần.',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Viên uống bổ khớp Glucosamine Orihiro 900',
    category: 'Thực phẩm chức năng',
    price: 713055,
    description: 'Hỗ trợ làm trơn ổ khớp, hỗ trợ hạn chế lão hóa khớp. Uống 10 viên/ngày với nước.',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Viên uống Nattokinase 2000FU Orihiro giảm đột quỵ',
    category: 'Thực phẩm chức năng',
    price: 445680,
    description: 'Hỗ trợ sức khỏe tim mạch, giảm nguy cơ đột quỵ',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Nhuộm tóc Bigen số 5 MA',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 165765,
    description: 'Thuốc nhuộm tóc Bigen nội địa Nhật',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Nhuộm tóc Bigen số 4 MA',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 165765,
    description: 'Thuốc nhuộm tóc Bigen nội địa Nhật',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Kem đánh răng Clinica Advantage + Whitening',
    category: 'Gia dụng nội địa',
    price: 120735,
    description: 'Làm trắng răng, bảo vệ men răng',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Sữa rửa mặt collagen Perfect Whip',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 198510,
    description: 'Sữa rửa mặt Senka Perfect Whip Collagen',
    imageUrl: '',
    hot: true,
    stock: 100
  },
  {
    name: 'Sữa rửa mặt trắng da Perfect Whip',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 198510,
    description: 'Sữa rửa mặt Senka Perfect Whip White',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Chống nắng Anessa Gel NA 90g SPF50+ PA++++',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 699540,
    description: 'Gel dưỡng da chống nắng cho mặt và toàn thân, kem lót trang điểm không thấm nước',
    imageUrl: '',
    hot: true,
    stock: 100
  },
  {
    name: 'Sữa dưỡng thể NIVEA Premium Body Milk Moisture',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 257325,
    description: 'Dưỡng ẩm toàn thân',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Tảo xoắn Nhật Bản (Spirulina)',
    category: 'Thực phẩm chức năng',
    price: 689580,
    description: 'Điều hòa huyết áp, ngăn ngừa thiếu máu. Uống 20-30 viên rải đều trong ngày.',
    imageUrl: '',
    hot: true,
    stock: 100
  },
  {
    name: 'Kem chống nắng trị liệu Transino uv protector',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 631200,
    description: 'Kem chống nắng trang điểm chống thâm nám Transino',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Salonpas dán lạnh 40 miếng',
    category: 'Thực phẩm chức năng',
    price: 187125,
    description: 'Giảm đau vai gáy, xương khớp',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Salonpas dán nóng 20 miếng',
    category: 'Thực phẩm chức năng',
    price: 186360,
    description: 'Giảm đau nhức mỏi',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Vitamin E DHC',
    category: 'Thực phẩm chức năng',
    price: 372810,
    description: 'Chống oxy hóa, Tăng cường hệ miễn dịch, làm đẹp da và tóc. Uống 1 viên sau ăn.',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Son dưỡng môi có màu',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 211350,
    description: 'Son dưỡng ẩm có màu',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Son thuốc dưỡng môi 1 cái',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 42285,
    description: 'Dùng mùa đông, chống nứt nẻ môi',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Kem chống nắng nâng tone Skin Aqua',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 279855,
    description: 'Chống nắng, nâng tone da',
    imageUrl: '',
    hot: true,
    stock: 100
  },
  {
    name: 'Kem chống nắng nâng tone Suncut',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 263790,
    description: 'Chống nắng Suncut tone up',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Dầu nóng xoa bóp Yokoyoko Ammeltz Kobayashi',
    category: 'Thực phẩm chức năng',
    price: 179940,
    description: 'Cứng vai, đau cơ, mỏi cơ, bầm tím...',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Hạt nêm rong biển',
    category: 'Gia dụng nội địa',
    price: 95490,
    description: 'Hạt nêm chiết xuất rong biển',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'Kem chống nắng ANESSA Perfect UV Skin Care Milk NA 60mL SPF50+ PA++++',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 636600,
    description: 'Chống nắng cho mặt và toàn thân, kem lót trang điểm',
    imageUrl: '',
    hot: true,
    stock: 100
  },
  {
    name: 'Mặt nạ gạo Keana Nadeshiko dành cho da khô',
    category: 'Mỹ phẩm & Làm đẹp',
    price: 212325,
    description: 'Dưỡng ẩm, làm săn chắc và se khít lỗ chân lông',
    imageUrl: '',
    hot: false,
    stock: 100
  },
  {
    name: 'コラーゲン DHC 90日分 (Collagen DHC 90 ngày)',
    category: 'Thực phẩm chức năng',
    price: 636645,
    description: 'Cải thiện và duy trì khả năng giữ nước, đàn hồi cho da. Uống 6 viên/ngày.',
    imageUrl: '',
    hot: true,
    stock: 100
  },
  {
    name: 'Trị nám Transino EX 240 viên',
    category: 'Thực phẩm chức năng',
    price: 1724970,
    description: 'Đặc trị nám chân sâu & nám nội tiết. Uống 4 viên/ngày chia 2 lần.',
    imageUrl: '',
    hot: true,
    stock: 100
  }
];

export async function seedProducts() {
  try {
    for (const p of INITIAL_PRODUCTS) {
      // Check if product already exists by name
      const q = query(collection(db, 'products'), where('name', '==', p.name));
      const snap = await getDocs(q);
      if (snap.empty) {
        try {
          await addDoc(collection(db, 'products'), p);
          console.log(`Seeded: ${p.name}`);
        } catch (e) {
          console.warn(`Could not seed ${p.name} (Permission denied or other error)`);
        }
      }
    }
    console.log('Seeding check completed');
  } catch (error) {
    console.warn('Could not check products for seeding (possibly unauthenticated or rules restriction)');
  }
}

