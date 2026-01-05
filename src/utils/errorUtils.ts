export const formatFirebaseError = (error: any): string => {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này';
    case 'auth/invalid-credential':
      return 'Thông tin xác thực không hợp lệ';
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn';
    case 'auth/invalid-email':
      return 'Email không hợp lệ';
    case 'auth/user-disabled':
      return 'Tài khoản đã bị vô hiệu hóa';
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử. Vui lòng thử lại sau';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet';
    case 'auth/requires-recent-login':
      return 'Vui lòng đăng nhập lại để thực hiện thao tác này';
    default:
      return error?.message || 'Đã xảy ra lỗi không xác định';
  }
};