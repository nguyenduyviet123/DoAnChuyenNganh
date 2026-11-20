const API_BASE = '/api';
const form = document.getElementById('login-form');
const errorMessage = document.getElementById('login-error');
const submitButton = document.getElementById('login-submit');
const passwordInput = document.getElementById('login-password');
const togglePassword = document.getElementById('toggle-password');

togglePassword.addEventListener('click', () => {
  const reveal = passwordInput.type === 'password';
  passwordInput.type = reveal ? 'text' : 'password';
  togglePassword.textContent = reveal ? 'Ẩn' : 'Hiện';
  togglePassword.setAttribute('aria-label', reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  togglePassword.setAttribute('aria-pressed', String(reveal));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = 'Đang đăng nhập...';

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.elements.username.value.trim(),
        password: form.elements.password.value,
      }),
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
    }

    localStorage.setItem('fg_token', body.data.token);
    localStorage.setItem('fg_user', JSON.stringify(body.data.user));

    if (body.data.user.vaiTro === 'QuanTri') {
      window.location.assign('admin.html');
    } else if (new URLSearchParams(window.location.search).get('next') === 'checkout') {
      window.location.assign('../index.html?cart=1&checkout=1');
    } else {
      window.location.assign('../index.html');
    }
  } catch (error) {
    errorMessage.textContent = error instanceof TypeError
      ? 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và thử lại.'
      : error.message;
    submitButton.disabled = false;
    submitButton.textContent = 'Đăng nhập';
  }
});
