/**
 * Koha REST yanıtlarının KULLANDIĞIMIZ alanları. Sürümler arasında alan adları değişebildiği
 * için tüm alanlar isteğe bağlıdır ve okuma `normalize.ts` içinde savunmacı yapılır.
 */

export interface KohaPatron {
  patron_id: number;
  firstname?: string | null;
  surname?: string | null;
  cardnumber?: string | null;
  userid?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  category_id?: string | null;
  library_id?: string | null;
  date_enrolled?: string | null;
  expiry_date?: string | null;
  restricted?: boolean | null;
  extended_attributes?: { type?: string; code?: string; value?: string | null }[];
}

export interface KohaCheckout {
  checkout_id: number;
  patron_id?: number;
  item_id?: number;
  library_id?: string | null;
  checkout_date?: string | null;
  due_date: string;
  renewals_count?: number | null;
  renewals?: number | null;
  item?: KohaItem | null;
}

export interface KohaRenewability {
  allows_renewal: boolean;
  max_renewals?: number | null;
  current_renewals?: number | null;
  error?: string | null;
}

export interface KohaHold {
  hold_id: number;
  patron_id?: number;
  biblio_id: number;
  item_id?: number | null;
  pickup_library_id?: string | null;
  hold_date?: string | null;
  expiration_date?: string | null;
  waiting_date?: string | null;
  priority?: number | null;
  status?: string | null;
  suspended?: boolean | null;
  biblio?: KohaBiblio | null;
}

export interface KohaAccountLine {
  account_line_id: number;
  date?: string | null;
  amount?: number | string | null;
  amount_outstanding?: number | string | null;
  description?: string | null;
  debit_type?: string | null;
  credit_type?: string | null;
}

export interface KohaAccount {
  balance?: number | string | null;
  outstanding_debits?: { total?: number; lines?: KohaAccountLine[] };
}

export interface KohaBiblio {
  biblio_id: number;
  title?: string | null;
  subtitle?: string | null;
  author?: string | null;
  publisher?: string | null;
  publication_year?: string | number | null;
  copyright_date?: string | number | null;
  publication_place?: string | null;
  place?: string | null;
  isbn?: string | null;
  issn?: string | null;
  pages?: string | null;
  edition_statement?: string | null;
  item_type?: string | null;
  series_title?: string | null;
  abstract?: string | null;
  notes?: string | null;
}

export interface KohaItem {
  item_id: number;
  biblio_id?: number;
  external_id?: string | null;
  home_library_id?: string | null;
  holding_library_id?: string | null;
  location?: string | null;
  callnumber?: string | null;
  item_type_id?: string | null;
  not_for_loan_status?: number | null;
  effective_not_for_loan_status?: number | null;
  lost_status?: number | null;
  damaged_status?: number | null;
  withdrawn?: number | boolean | null;
  checked_out_date?: string | null;
  acquisition_date?: string | null;
}

export interface KohaLibrary {
  library_id: string;
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  postal_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  url?: string | null;
  pickup_location?: boolean | null;
}

export interface KohaItemType {
  item_type_id: string;
  description?: string | null;
}

export interface KohaPasswordValidation {
  patron_id: number;
  cardnumber?: string | null;
  userid?: string | null;
}
