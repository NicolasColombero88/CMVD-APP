// src/modules/calculate/infrastructure/calculateService.ts

/**
 * Servicio de cálculo de tarifa.
 * Expone:
 *  - named export:    Calculate.set(payload, token)
 *  - named export:    CalculateService.quote(payload, token)
 *  - default export:  Calculate
 *
 * Así evitamos errores de import en componentes que esperan { Calculate }.
 */

const base = (import.meta.env.VITE_API_URL || "").trim();

// Normaliza la URL base y agrega /v1/
const API_URL = (base.endsWith("/") ? base : base + "/") + "v1/";

// Tipos básicos (opcionales, para TypeScript)
export type PackageDimensions = {
  length: number;
  width: number;
  height: number;
};

export type PackageDetail = {
  type?: string;
  package_number?: string;
  description?: string;
  weight: number;
  quantity: number;
  price?: number;
  dimensions: PackageDimensions;
};

export type CalculatePayload = {
  sender_city?: string;
  sender_neighborhood?: string;
  recipient_city: string;
  recipient_neighborhood: string;
  company_id?: string | number;
  package_detail?: PackageDetail[]; // según tu back, puede llamarse así
  packages?: PackageDetail[];       // aceptamos ambos nombres por compatibilidad
};

async function postJson(url: string, body: unknown, token?: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  // Si la API devuelve error, arrojamos con texto para facilitar debug
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }

  // Intentamos parsear JSON; si falla, devolvemos objeto vacío
  const data = await res.json().catch(() => ({}));
  return data;
}

/**
 * Implementación principal usada en muchos componentes:
 * Calculate.set(payload, token) -> devuelve el JSON de la API.
 * Debe existir para no romper imports existentes.
 */
export const Calculate = {
  /**
   * Hace el POST a /v1/calculate y retorna el JSON crudo que responda tu API.
   * Ejemplos de formas esperadas:
   *  - { price: 123 }
   *  - { data: { price: 123 } }
   *  - { total: 123 }
   */
  async set(payload: CalculatePayload, token?: string): Promise<any> {
    // Compatibilidad: si vino "packages", la API antiguamente esperaba "package_detail"
    const body: any = {
      ...payload,
      package_detail: payload.package_detail ?? payload.packages ?? [],
    };

    const data = await postJson(API_URL + "calculate", body, token);
    return data;
  },
};

/**
 * Alias más expresivo, con un helper para extraer el número de precio.
 */
export const CalculateService = {
  /**
   * quote(payload, token) -> { price: number, raw: any }
   * Normaliza la forma de la respuesta y te da un número siempre.
   */
  async quote(payload: CalculatePayload, token?: string): Promise<{ price: number; raw: any }> {
    const raw = await Calculate.set(payload, token);

    const price =
      (raw?.data?.price ??
        raw?.price ??
        raw?.total ??
        0) as number;

    return { price: Number(price) || 0, raw };
  },

  // Por si en algún sitio usaban .set como en Calculate
  async set(payload: CalculatePayload, token?: string) {
    return Calculate.set(payload, token);
  },
};

// Default export por compatibilidad potencial con otros imports
export default Calculate;
