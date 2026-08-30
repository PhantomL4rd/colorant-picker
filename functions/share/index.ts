import { APP_BASE_URL } from '../../cloudflare/og/utils';

export const onRequestGet: PagesFunction = () => Response.redirect(APP_BASE_URL, 302);
