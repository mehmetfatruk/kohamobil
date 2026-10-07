import { useTranslation } from 'react-i18next';

import { Screen } from '../../src/components/Screen';

export default function CatalogScreen() {
  const { t } = useTranslation();
  return <Screen title={t('tabs.catalog')} subtitle={t('common.comingSoon')} />;
}
