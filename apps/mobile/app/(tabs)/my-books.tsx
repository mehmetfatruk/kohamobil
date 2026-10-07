import { useTranslation } from 'react-i18next';

import { Screen } from '../../src/components/Screen';

export default function MyBooksScreen() {
  const { t } = useTranslation();
  return <Screen title={t('tabs.myBooks')} subtitle={t('common.comingSoon')} />;
}
