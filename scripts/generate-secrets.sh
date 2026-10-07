#!/usr/bin/env sh
# Secret dosyalarını SUNUCUDA rastgele üretir. Üretilen dosyalar ASLA repoya eklenmez.
#
#   scripts/generate-secrets.sh [hedef-dizin]
#
# Varsayılan hedef: infra/docker/.secrets (yerel geliştirme; .gitignore kapsamında).
# Üretim önerisi: /etc/mirakil/secrets (root:root, 700).
# Mevcut dosyaların üzerine YAZMAZ (rotasyon bilinçli yapılmalıdır, bkz. docs/DEPLOYMENT.md §8).
set -eu

TARGET="${1:-$(dirname "$0")/../infra/docker/.secrets}"
SECRETS="postgres_password redis_password"

umask 077
mkdir -p "$TARGET"

for name in $SECRETS; do
  file="$TARGET/$name"
  if [ -s "$file" ]; then
    echo "atlandı (mevcut): $file"
  else
    # URL/bağlantı dizesi güvenli karakterler: base64url, 48 karakter
    openssl rand -base64 36 | tr '+/' '-_' | tr -d '=\n' > "$file"
    echo "üretildi: $file"
  fi
done
