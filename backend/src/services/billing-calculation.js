const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;

// Included taxes share the same net base; exclusive taxes do not tax other taxes.
function calculateBill(items, serviceCharge, selected) {
  const parts = roundMoney(items.reduce((sum, item) => sum + roundMoney(item.qty * item.cost), 0));
  const service = roundMoney(serviceCharge);
  const inclusiveRate = scope => selected.filter(t => t.is_inclusive && (t.applies_to === scope || t.applies_to === 'all')).reduce((sum, t) => sum + Number(t.rate), 0);
  const partsNet = parts / (1 + inclusiveRate('parts') / 100);
  const serviceNet = service / (1 + inclusiveRate('service') / 100);
  const taxes = selected.map(tax => {
    const base = tax.applies_to === 'parts' ? partsNet : tax.applies_to === 'service' ? serviceNet : partsNet + serviceNet;
    return { ...tax, rate: Number(tax.rate), amount: roundMoney(base * Number(tax.rate) / 100) };
  });
  const taxTotal = roundMoney(taxes.reduce((sum, tax) => sum + tax.amount, 0));
  const exclusive = roundMoney(taxes.filter(t => !t.is_inclusive).reduce((sum, tax) => sum + tax.amount, 0));
  const total = roundMoney(parts + service + exclusive);
  return { parts, service, taxes, taxTotal, subtotal: roundMoney(total - taxTotal), total };
}
module.exports = { roundMoney, calculateBill };
