# OrderFood Admin Console

Một ứng dụng quản lý đơn hàng thực phẩm với giao diện console hiện đại, được xây dựng bằng HTML, CSS và JavaScript ES6 modules.

## 🏗️ Cấu trúc dự án

```
orderfood/
├── index.html          # File HTML chính - giao diện ứng dụng
├── README.md           # Tài liệu dự án
├── css/
│   └── styles.css      # File CSS tùy chỉnh cho styling
├── js/                 # Thư mục chứa các JavaScript modules
│   ├── app.js          # Entry point chính - khởi tạo ứng dụng
│   ├── auth.js         # Xử lý authentication và user state
│   ├── commands.js     # Xử lý command logic và command list
│   ├── constants.js    # Constants và configuration
│   ├── modals.js       # Xử lý tất cả modal logic
│   └── ui-utils.js     # Utility functions cho UI
└── assets/             # Thư mục cho assets (nếu cần)
```

## 📁 Mô tả các file

### HTML
- **`index.html`**: File HTML chính chứa cấu trúc DOM của ứng dụng, các modals và form

### CSS
- **`css/styles.css`**: Chứa tất cả custom CSS styles, animations và responsive design

### JavaScript Modules

#### **`js/app.js`** - Main Entry Point
- Khởi tạo toàn bộ ứng dụng
- Setup event listeners chính
- Điều phối các modules khác

#### **`js/constants.js`** - Configuration & Constants
- Định nghĩa các constants và configuration
- URL endpoints cho API
- Danh sách commands với permissions

#### **`js/auth.js`** - Authentication Management
- Quản lý authentication state
- LocalStorage operations
- User login/logout functionality
- UI updates cho auth status

#### **`js/ui-utils.js`** - UI Utilities
- Utility functions cho UI interactions
- Message display functions
- Modal management utilities
- Footer alignment helpers

#### **`js/modals.js`** - Modal Management
- Xử lý tất cả modal logic
- Form submissions cho các modals
- Modal opening/closing functions
- Video modal functionality

#### **`js/commands.js`** - Command Processing
- Xử lý command input và validation
- Command list management
- Webhook command processing
- Help system

## 🚀 Tính năng chính

- **Authentication System**: Đăng nhập/đăng xuất với token-based auth
- **Command Interface**: Giao diện command line hiện đại
- **Modal System**: Các modal để nhập liệu và interaction
- **Real-time Communication**: Kết nối webhook để xử lý commands
- **Responsive Design**: Hoạt động tốt trên mọi thiết bị
- **Role-based Access**: Phân quyền user/admin cho các commands

## 💡 Các lệnh có sẵn

- `/auth` - Đăng nhập hệ thống
- `/help` - Xem danh sách lệnh
- `/logout` - Đăng xuất
- `/menu` - Xem thực đơn
- `/insert` - Thêm món mới (Admin only)
- `/create_user` - Tạo user mới (Admin only)
- `/update_password` - Cập nhật mật khẩu
- Và nhiều lệnh admin khác...

## 🛠️ Công nghệ sử dụng

- **HTML5**: Cấu trúc semantic
- **CSS3**: Custom styles + Tailwind CSS
- **JavaScript ES6+**: Modules, async/await, modern syntax
- **Fetch API**: HTTP requests
- **LocalStorage**: Client-side state persistence
- **CSS Grid/Flexbox**: Layout responsive

## 📱 Responsive Design

Ứng dụng được thiết kế responsive với:
- Mobile-first approach
- Flexible layout cho desktop và mobile
- Adaptive footer positioning
- Touch-friendly interface

## 🔒 Bảo mật

- Token-based authentication
- Role-based command access
- Input validation
- Secure API communication

## 🎨 UI/UX Features

- Dark theme với accent colors
- Smooth animations và transitions
- Loading states cho async operations
- Intuitive command interface
- Modal-based interactions
- Command autocomplete

---

*Dự án được tổ chức theo cấu trúc modular để dễ maintain và scale trong tương lai.*