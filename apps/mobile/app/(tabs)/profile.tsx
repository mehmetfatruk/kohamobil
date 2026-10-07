import { useTranslation } from 'react-i18next';

import { Screen } from '../../src/components/Screen';

export default function ProfileScreen() {
  const { t } = useTranslation();
  return <Screen title={t('tabs.profile')} subtitle={t('common.comingSoon')} />;
}
