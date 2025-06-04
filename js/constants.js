// Application constants and configuration
export const CONFIG = {
    WEBHOOK_BASE_URL: 'https://dev-workflow.aquanets.com/webhook',
    ENDPOINTS: {
        COMMANDS: 'commands',
        LOGIN: 'cd168345-40c9-4130-afda-f0680e3be509/login'
    },
    STORAGE_KEY: 'adminConsoleAppUser'
};

// Available commands with role definitions
export const AVAILABLE_COMMANDS = [
    { name: '/auth', desc: 'Dô mần việc.', allowedRoles: ['guest', 'user', 'admin'], opensDialog: true },
    { name: '/help', desc: 'Coi mấy cái lệnh.', allowedRoles: ['guest', 'user', 'admin'] },
    { name: '/my_orders', desc: 'Xem đơn hàng đã đặt của bạn.', allowedRoles: ['user', 'admin'], opensDialog: false },
    { name: '/logout', desc: 'Đi dìa.', allowedRoles: ['user', 'admin'] },
    { name: '/insert', desc: 'Thiêm món.', allowedRoles: ['admin'], opensDialog: true },
    { name: '/menu', desc: 'Coi thực đơn.', allowedRoles: ['user', 'admin'] },
    { name: '/delete', desc: 'Xó hếch mấy cái vừa kiu', allowedRoles: ['user', 'admin'] },
    { name: '/add', desc: 'Bỏ đồ ăn dô dỏ nèo.', allowedRoles: ['user', 'admin'] },
    { name: '/lock', desc: 'Khó hông cho kiu đồ ăn nữa.', allowedRoles: ['admin'] },
    { name: '/unlock', desc: 'Mở cho kiu đồ ăn.', allowedRoles: ['admin'] },
    { name: '/publish', desc: 'Nấu đi nèo.', allowedRoles: ['admin'] },
    { name: '/aggregate', desc: 'Coi mấy cái đồ ăn nẫu kêu thử.', allowedRoles: ['admin'] },
    { name: '/create_user', desc: 'Làm người xài mới.', allowedRoles: ['admin'], opensDialog: true },
    { name: '/update_password', desc: 'Đẩu cái bí mật của mi đi.', allowedRoles: ['user', 'admin'], opensDialog: true },
    { name: '/debt', desc: 'Kiểm tra nợ và nhận lời nhắc sáng tạo.', allowedRoles: ['user'] }
]; 