import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import isBetween from "dayjs/plugin/isBetween.js";
// Add this import
dayjs.extend(isBetween);

dayjs.extend(utc);

export default (item, color, wholesaler) => {
  const today = dayjs().utc();

  const formatPrice = price => {
    return typeof price === "number" ? price.toFixed(2) : price;
  };
  const calculateDiscount = (currentPrice, originalPrice) => {
    if (!currentPrice || !originalPrice) return null;
    // Use parseFloat instead of parseInt to maintain decimal precision
    return (100 * (1 - parseFloat(currentPrice) / parseFloat(originalPrice))).toFixed(0);
  };

  // Wholesale price display
  if (wholesaler && item.wholesale_price) {
    return `<div style="font-size: 25px; display: flex; align-items: center; gap: 4px; color: ${color}">
      WSP: $${formatPrice(item.wholesale_price)}
    </div>`;
  }

  // Sale price display
  if (
    item.sale?.price &&
    item.sale?.start_date &&
    item.sale?.end_date &&
    today.isBetween(dayjs(item.sale.start_date).utc(), dayjs(item.sale.end_date).utc())
  ) {
    const discount = calculateDiscount(item.sale?.price, item.price);
    const quantity = item.quantity || 1;
    const promoPrice = item.promoPrice;

    return `<div style="font-size: 25px; display: flex; align-items: center; gap: 8px; color: ${color}">
      ${item.isPreOrder ? "Preorder " : ""}
      <span>$${formatPrice((promoPrice || item.sale?.price) * quantity)}</span>
      ${discount ? `<span>(${discount}% Off)</span>` : ""}
      ${promoPrice ? `<span>(+Promo Applied)</span>` : ""}
      <del style="color: #ff0000;">
        <span style="color: ${color};">$${formatPrice(item.price * quantity)}</span>
      </del>
    </div>`;
  }

  // Previous price display
  if (item.previous_price) {
    const discount = calculateDiscount(item.price, item.previous_price);
    const quantity = item.quantity || 1;

    return `<div style="font-size: 25px; display: flex; align-items: center; gap: 8px; color: ${color}">
      ${item.isPreOrder ? "Preorder " : ""}
      <span>$${formatPrice(item.price * quantity)}</span>
      ${discount ? `<span>(${discount}% Off)</span>` : ""}
      <del style="color: #ff0000;">
        <span style="color: ${color};">$${formatPrice(item.previous_price * quantity)}</span>
      </del>
    </div>`;
  }

  // Sold out display
  if (item.quantity === 0) {
    return `<div style="font-size: 25px; display: flex; align-items: center; gap: 8px; color: ${color}">
      ${item.isPreOrder ? "Preorder " : ""}
      <del style="color: #ff0000;">
        <span style="color: ${color};">$${formatPrice(item.price)}</span>
      </del>
      <span>Sold Out</span>
    </div>`;
  }

  // Regular price display
  return `<div style="font-size: 25px; display: flex; align-items: center; gap: 4px; color: ${color}">
    ${item.isPreOrder ? "Preorder " : ""}
    $${formatPrice(item.price * (item.quantity || 1))}
  </div>`;
};
