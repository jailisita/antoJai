export const formatCOP = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

/** Abre WhatsApp con un número colombiano (10 dígitos) o ya con indicativo. */
export const whatsappUrl = (phone: string, text?: string) => {
  const digits = phone.replace(/\D/g, '');
  const full = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
