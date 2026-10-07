import { useTranslation } from 'react-i18next';

import { Screen } from '../../src/components/Screen';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  return <Screen title={t('tabs.notifications')} subtitle={t('common.comingSoon')} />;
}
