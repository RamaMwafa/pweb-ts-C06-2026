
import type {
  JenisAntrian,
  TiketAntrian,
  Prioritas
} from "./types.js";

export const STORAGE_JENIS = "rs_jenis_antrian";
export const STORAGE_TIKET = "rs_tiket_antrian";

const AWAL: JenisAntrian[] = [
  {
    id: "umum-1",
    kode: "A",
    nama: "UMUM-1",
    aktif: true
  },
  {
    id: "umum-2",
    kode: "B",
    nama: "UMUM-2",
    aktif: true
  },
  {
    id: "umum-3",
    kode: "C",
    nama: "UMUM-3",
    aktif: true
  },
  {
    id: "gigi",
    kode: "G",
    nama: "GIGI",
    aktif: true
  },
  {
    id: "farmasi",
    kode: "F",
    nama: "FARMASI",
    aktif: true
  },
  {
    id: "psikolog",
    kode: "P",
    nama: "PSIKOLOG",
    aktif: true
  }
];

function bacaJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);

  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error(`Penyimpanan ${key} rusak`);
    return fallback;
  }
}

export function ambilJenis(): JenisAntrian[] {
  if (localStorage.getItem(STORAGE_JENIS) === null) {
    localStorage.setItem(
      STORAGE_JENIS,
      JSON.stringify(AWAL)
    );
  }

  const jenis = bacaJSON<JenisAntrian[]>(
    STORAGE_JENIS,
    []
  );

  return Array.isArray(jenis) ? jenis : [];
}

export function ambilTiket(): TiketAntrian[] {
  const tiket = bacaJSON<TiketAntrian[]>(
    STORAGE_TIKET,
    []
  );

  return Array.isArray(tiket) ? tiket : [];
}

export function buatTiket(
  jenisId: string,
  prioritas: Prioritas
): TiketAntrian {
  const jenis = ambilJenis().find(
    j => j.id === jenisId && j.aktif
  );

  if (!jenis) {
    throw new Error(
      "Jenis antrean tidak aktif atau tidak ditemukan."
    );
  }

  const tiket = ambilTiket();

  const terbesar = tiket
    .filter(t => t.jenisId === jenisId)
    .reduce((n, t) => {
      const angka = Number(
        t.nomor.split("-").pop()
      );

      return Math.max(
        n,
        Number.isFinite(angka) ? angka : 0
      );
    }, 0);

  const baru: TiketAntrian = {
    id: crypto.randomUUID(),
    jenisId,
    nomor:
      `${jenis.kode}-${String(terbesar + 1).padStart(3, "0")}`,
    prioritas,
    status: "Menunggu",
    dibuatPada: new Date().toISOString()
  };

  localStorage.setItem(
    STORAGE_TIKET,
    JSON.stringify([...tiket, baru])
  );

  return baru;
}
