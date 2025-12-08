// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const userList = document.getElementById('userList');
  const userCount = document.getElementById('userCount');

  const loadUsers = async (params = {}) => {
    try {
      const url = new URL('/users/api/users', window.location.origin);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const res = await fetch(url);
      const data = await res.json();
      const users = Array.isArray(data) ? data : []; // แก้ตรงนี้!

      userCount.textContent = `${users.length} รายการ`;

      if (users.length === 0) {
        userList.innerHTML = '<tr><td colspan="5" class="text-center text-muted">ไม่พบข้อมูล</td></tr>';
        return;
      }

      userList.innerHTML = users.map((user, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><a href="#" class="fw-bold text-primary">${user.username}</a></td>
          <td>
            ${user.full_name || '-'}<br>
            <small class="text-muted">${user.phone || '-'}</small>
          </td>
          <td class="text-end">${Number(user.credit).toLocaleString('th-TH', { minimumFractionDigits: 2 })} LAK_THB</td>
          <td>
            <span class="badge ${getStatusClass(user.status)}">${getStatusText(user.status)}</span>
            <div class="mt-1">
              <button class="btn btn-sm btn-success update-status" 
                      data-id="${user.id}" data-status="APPROVED" title="อนุมัติ">
                <i class="bi bi-check-lg"></i>
              </button>
              <button class="btn btn-sm btn-danger update-status" 
                      data-id="${user.id}" data-status="REJECTED" title="ปฏิเสธ">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('โหลดข้อมูลล้มเหลว:', err);
      userList.innerHTML = '<tr><td colspan="5" class="text-center text-danger">❌ โหลดข้อมูลไม่ได้</td></tr>';
    }
  };

  const getStatusClass = (status) => {
    return status === 'APPROVED' ? 'bg-success' : 
           status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger';
  };

  const getStatusText = (status) => {
    return status === 'APPROVED' ? 'อนุมัติแล้ว' : 
           status === 'PENDING' ? 'รออนุมัติ' : 'ปฏิเสธ';
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch('/users/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, changed_by: 'admin' })
      });
      const data = await res.json();
      if (data.success) {
        loadUsers(getSearchParams());
      } else {
        alert('❌ ' + (data.error || 'อัปเดตล้มเหลว'));
      }
    } catch (err) {
      alert('❌ อัปเดตสถานะล้มเหลว');
    }
  };

  const getSearchParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      search: urlParams.get('search') || '',
      status: urlParams.get('status') || ''
    };
  };

  loadUsers(getSearchParams());

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(searchForm);
    const params = {};
    for (let [key, value] of formData.entries()) {
      if (value) params[key] = value;
    }
    window.location.search = new URLSearchParams(params).toString();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.update-status')) {
      const btn = e.target.closest('.update-status');
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      if (confirm(`คุณแน่ใจว่าต้องการ${status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}ผู้เล่นนี้?`)) {
        updateStatus(id, status);
      }
    }
  });

  // Export Excel
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const params = getSearchParams();
    const url = new URL('/users/export', window.location.origin);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    window.open(url, '_blank');
  });
});