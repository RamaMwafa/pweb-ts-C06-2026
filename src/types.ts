export type Prioritas =
  | "Normal"
  | "Lansia"
  | "Disabilitas"
  | "VIP"
  | "Ibu Hamil"
  | "Anak-anak";

export type StatusTiket =
  | "Menunggu"
  | "Dipanggil"
  | "Selesai"
  | "Dilewati";

export interface JenisAntrian {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
}

export interface TiketAntrian {
  id: string;
  jenisId: string;
  nomor: string;
  prioritas: Prioritas;
  status: StatusTiket;
  dibuatPada: string;
  dipanggilPada?: string;
}
