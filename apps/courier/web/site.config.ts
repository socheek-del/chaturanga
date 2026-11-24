/** The default address for this product. Override per environment. */
export const SITE_URL = (process.env.COURIER_SITE_URL ?? 'https://courier.beanroti.com').replace(/\/+$/, '');
