import { useTranslation } from 'react-i18next';

import { Screen } from '../../src/components/Screen';

export default function HomeScreen() {
  const { t } = useTranslation();
  return <Screen title={t('tabs.home')} subtitle={t('common.comingSoon')} />;
}
