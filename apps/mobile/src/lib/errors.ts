import { ERROR_CODES, type ErrorCode } from '@mirakil/types';
import i18n from 'i18next';

import { ApiError } from '../api';

/** Her hatayı kullanıcı dostu, yerelleştirilmiş metne çevirir (ham hata asla gösterilmez). */
export function errorText(error: unknown): string {
  if (error instanceof ApiError && (ERROR_CODES as readonly string[]).includes(error.code)) {
    return i18n.t(`errors.${error.code satisfies ErrorCode}`, {
      correlationId: error.correlationId ?? '—',
    });
  }
  return i18n.t('common.error');
}
