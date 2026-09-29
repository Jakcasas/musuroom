const fields = {
  mass: document.getElementById('input-mass'),
  reject: document.getElementById('reject-rate'),
  initial: document.getElementById('initial-moisture'),
  final: document.getElementById('final-moisture'),
  loss: document.getElementById('process-loss')
};

const output = {
  accepted: document.getElementById('accepted-output'),
  powder: document.getElementById('powder-output'),
  rejected: document.getElementById('rejected-output'),
  error: document.getElementById('form-error')
};

const formatKg = value => `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)} kg`;

function calculateBatch() {
  const mass = Number(fields.mass.value);
  const reject = Number(fields.reject.value);
  const initial = Number(fields.initial.value);
  const final = Number(fields.final.value);
  const loss = Number(fields.loss.value);
  const valid = Object.values(fields).every(field => field.value !== '') && mass > 0 && mass <= 100000 &&
    [reject, initial, final, loss].every(Number.isFinite) &&
    reject >= 0 && reject < 100 && initial > 0 && initial < 100 &&
    final >= 0 && final < 100 && final < initial && loss >= 0 && loss < 100;

  if (!valid) {
    output.error.textContent = 'Vui lòng nhập số hợp lệ: khối lượng lớn hơn 0, các tỷ lệ trong khoảng cho phép và độ ẩm bột thấp hơn độ ẩm nguyên liệu.';
    output.error.hidden = false;
    output.accepted.textContent = '—';
    output.powder.textContent = '—';
    output.rejected.textContent = '—';
    return;
  }

  output.error.hidden = true;
  const accepted = mass * (1 - reject / 100);
  const drySolids = accepted * (1 - initial / 100);
  const powder = drySolids / (1 - final / 100) * (1 - loss / 100);
  output.accepted.textContent = formatKg(accepted);
  output.powder.textContent = formatKg(powder);
  output.rejected.textContent = formatKg(mass - accepted);
}

Object.values(fields).forEach(field => field.addEventListener('input', calculateBatch));
calculateBatch();
