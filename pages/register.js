const API_BASE = '/api';
const form = document.getElementById('register-form');
const errorMessage = document.getElementById('register-error');
const submitButton = document.getElementById('register-submit');

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword);
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    button.textContent = reveal ? 'Ẩn' : 'Hiện';
    button.setAttribute('aria-label', reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    button.setAttribute('aria-pressed', String(reveal));
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = 'Đang tạo tài khoản...';

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.elements.fullName.value.trim(),
        username: form.elements.username.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        password: form.elements.password.value,
      }),
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.');
    }

    localStorage.setItem('fg_token', body.data.token);
    localStorage.setItem('fg_user', JSON.stringify(body.data.user));
    window.location.assign('../index.html');
  } catch (error) {
    errorMessage.textContent = error instanceof TypeError
      ? 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và thử lại.'
      : error.message;
    submitButton.disabled = false;
    submitButton.textContent = 'Tạo tài khoản';
  }
});
