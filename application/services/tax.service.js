import { apiService } from './api.service';

export const taxService = {
  getAll: (status) => apiService.get(status ? `/taxes?status=${status}` : '/taxes'),
  create: (data) => apiService.post('/taxes', data),
  update: (id, data) => apiService.put(`/taxes/${id}`, data),
  delete: (id) => apiService.delete(`/taxes/${id}`),

  // Helper: compute tax amounts for a given subtotal using active tax settings
  computeTaxes: (taxSettings, partsSubtotal, serviceCharge) => {
    const activeTaxes = taxSettings.filter(t => t.is_active);
    let taxTotal = 0;
    const taxSnapshot = activeTaxes.map(tax => {
      let base = 0;
      if (tax.applies_to === 'all') base = partsSubtotal + serviceCharge;
      else if (tax.applies_to === 'parts') base = partsSubtotal;
      else if (tax.applies_to === 'service') base = serviceCharge;

      let amount = 0;
      if (tax.is_inclusive) {
        // Inclusive: tax is already IN the base price. Extract it.
        amount = base - (base / (1 + tax.rate / 100));
      } else {
        // Exclusive: tax is added ON TOP
        amount = base * (tax.rate / 100);
      }
      amount = Math.round(amount * 100) / 100;
      taxTotal += amount;
      return { id: tax.id, name: tax.name, rate: tax.rate, amount, is_inclusive: tax.is_inclusive, applies_to: tax.applies_to };
    });
    return { taxSnapshot, taxTotal: Math.round(taxTotal * 100) / 100 };
  }
};
