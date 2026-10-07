import type { ErrorCode } from '@mirakil/types';

export const tr = {
  app: {
    name: 'MirAkıl Kütüphane',
    poweredBy: 'MirAkıl tarafından geliştirilmiştir',
    integrationNote: 'Koha kütüphane yönetim sistemleri ile entegre çalışır',
  },
  tabs: {
    home: 'Ana Sayfa',
    catalog: 'Katalog',
    myBooks: 'Kitaplarım',
    notifications: 'Bildirimler',
    profile: 'Profil',
  },
  onboarding: {
    welcomeTitle: 'Hoş geldiniz',
    welcomeBody: 'Kütüphane hesabınıza her yerden ulaşın.',
    start: 'Başla',
    selectTenant: 'Kurumunuzu Seçin',
    searchTenant: 'Kurum adı veya şehir ara',
  },
  common: {
    offline: 'İnternet bağlantısı yok. Son kaydedilen bilgiler gösteriliyor.',
    offlineActionDisabled: 'Bu işlem için internet bağlantısı gerekiyor.',
    lastUpdated: 'Son güncelleme: {{time}}',
    retry: 'Tekrar dene',
    comingSoon: 'Bu ekran yakında hazır olacak.',
  },
  errors: {
    VALIDATION_ERROR: 'Gönderilen bilgiler geçersiz.',
    AUTH_INVALID_CREDENTIALS: 'Kullanıcı adı/kart numarası veya şifre hatalı.',
    AUTH_TOKEN_EXPIRED: 'Oturum süreniz doldu.',
    AUTH_SESSION_REVOKED: 'Oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.',
    AUTH_ACCOUNT_RESTRICTED:
      'Hesabınızda kısıtlama bulunduğu için giriş yapılamıyor. Kütüphanenizle iletişime geçin.',
    AUTH_ACCOUNT_EXPIRED: 'Kütüphane üyeliğinizin süresi dolmuş.',
    AUTH_PATRON_NOT_FOUND: 'Kütüphane hesabınız bulunamadı. Kütüphanenizle iletişime geçin.',
    AUTH_PROVIDER_DISABLED: 'Bu giriş yöntemi kurumunuzda kullanılamıyor.',
    TENANT_INACTIVE: 'Kurumunuzun hizmeti şu anda kullanılamıyor.',
    TENANT_NOT_FOUND: 'Kurum bulunamadı.',
    FEATURE_DISABLED: 'Bu özellik kurumunuzda kullanılamıyor.',
    RESOURCE_NOT_FOUND: 'Kayıt bulunamadı.',
    LOAN_RENEWAL_TOO_MANY: 'Bu materyal için izin verilen en fazla yenileme sayısına ulaşıldı.',
    LOAN_RENEWAL_ON_HOLD:
      'Bu materyal başka bir okuyucu tarafından rezerve edildiği için yenilenemiyor.',
    LOAN_RENEWAL_TOO_SOON: 'Bu materyal henüz yenilenemez.',
    LOAN_RENEWAL_OVERDUE:
      'Gecikmiş materyaller uygulama üzerinden yenilenemiyor. Lütfen kütüphaneye başvurun.',
    LOAN_RENEWAL_RESTRICTED: 'Hesabınızdaki kısıtlama nedeniyle yenileme yapılamıyor.',
    LOAN_RENEWAL_FINES: 'Borcunuz izin verilen sınırı aştığı için yenileme yapılamıyor.',
    LOAN_RENEWAL_ACCOUNT_EXPIRED: 'Üyelik süreniz dolduğu için yenileme yapılamıyor.',
    LOAN_RENEWAL_AUTO: 'Bu materyal otomatik yenileme kapsamında; ayrıca yenilemeniz gerekmiyor.',
    LOAN_RENEWAL_NOT_ALLOWED:
      'Bu materyalin yenileme işlemi kütüphane politikaları nedeniyle gerçekleştirilemiyor.',
    HOLD_NOT_ALLOWED: 'Bu materyal için rezervasyon yapılamıyor.',
    HOLD_TOO_MANY: 'Yapabileceğiniz en fazla rezervasyon sayısına ulaştınız.',
    HOLD_ALREADY_EXISTS: 'Bu materyal için zaten bir rezervasyonunuz var.',
    HOLD_AGE_RESTRICTED: 'Bu materyal yaş sınırlaması nedeniyle rezerve edilemiyor.',
    HOLD_PICKUP_LOCATION_INVALID: 'Seçtiğiniz şube teslim noktası olarak kullanılamıyor.',
    HOLD_PATRON_RESTRICTED: 'Hesabınızdaki kısıtlama nedeniyle rezervasyon yapılamıyor.',
    HOLD_CANCEL_NOT_ALLOWED: 'Bu rezervasyon artık iptal edilemiyor.',
    PASSWORD_CURRENT_INVALID: 'Mevcut şifreniz hatalı.',
    PASSWORD_POLICY_VIOLATION: 'Yeni şifre kütüphane şifre kurallarına uymuyor.',
    PASSWORD_CHANGE_NOT_ALLOWED: 'Şifre değiştirme kurumunuzda kullanılamıyor.',
    RATE_LIMITED: 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.',
    APP_VERSION_UNSUPPORTED: 'Devam etmek için uygulamayı güncelleyin.',
    KOHA_UNAVAILABLE: 'Kütüphane sistemine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.',
    KOHA_TIMEOUT: 'Kütüphane sistemi zamanında yanıt vermedi.',
    INTERNAL_ERROR: 'Beklenmeyen bir hata oluştu. (Hata kodu: {{correlationId}})',
  } satisfies Record<ErrorCode, string>,
  /** Push metinleri — kişisel veri İÇERMEZ (docs/NOTIFICATIONS.md §5.2). */
  push: {
    title: 'MirAkıl Kütüphane',
    dueSoon: 'Bir materyalinizin iade tarihi yaklaşıyor. Ayrıntılar için uygulamayı açın.',
    dueToday: 'Bugün iade edilmesi gereken bir materyaliniz var. Ayrıntılar için uygulamayı açın.',
    overdue: 'İade tarihi geçmiş bir materyaliniz var. Ayrıntılar için uygulamayı açın.',
    holdReady: 'Rezervasyonunuz teslim almaya hazır. Ayrıntılar için uygulamayı açın.',
    holdExpiring: 'Hazır bekleyen rezervasyonunuzun teslim alma süresi doluyor.',
    membershipExpiring: 'Kütüphane üyeliğinizin süresi yakında doluyor.',
    announcement: 'Kütüphanenizden yeni bir duyuru var.',
    systemNewLogin: 'Hesabınıza yeni bir cihazdan giriş yapıldı.',
  },
};

/** Tüm dillerin uyması gereken yapı (Türkçe kaynak dildir). */
type DeepStringShape<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringShape<T[K]> };
export type Messages = DeepStringShape<typeof tr>;
