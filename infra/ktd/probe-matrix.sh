#!/usr/bin/env sh
# Çalışan bir KTD (koha-testing-docker) örneğine karşı uyumluluk raporu üretir ve
# packages/koha-client/test/fixtures/specs/<sürüm>.json altına spec'i kaydeder.
#
#   infra/ktd/probe-matrix.sh <sürüm-etiketi> [staff-url]
#
# Örnek: KTD 24.05 ayaktayken → infra/ktd/probe-matrix.sh 24.05 http://localhost:8081
set -eu

VERSION="${1:?Kullanım: probe-matrix.sh <sürüm> [staff-url]}"
STAFF_URL="${2:-http://localhost:8081}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$ROOT/packages/koha-client/test/fixtures/specs"
REPORT_DIR="$ROOT/infra/ktd/reports"
mkdir -p "$OUT_DIR" "$REPORT_DIR"

curl -fsS "$STAFF_URL/api/v1/" -o "$OUT_DIR/$VERSION.json"
pnpm --silent --filter @mirakil/koha-client probe -- "$STAFF_URL" --json --allow-insecure-localhost \
  > "$REPORT_DIR/$VERSION.json"
echo "spec:   $OUT_DIR/$VERSION.json"
echo "rapor:  $REPORT_DIR/$VERSION.json"
