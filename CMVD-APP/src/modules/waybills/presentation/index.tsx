import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Layout from "@/components/Layout";
import Table from "@/components/Table";
import ModalSelect from "@/components/ModalSelect";
import SelectCadete from "@/components/SelectCadete";
import { useSelector } from "react-redux";
import { Pagination, Waybills } from "../infrastructure/waybillsService";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "@mdi/react";
import {
  mdiCash,
  mdiEye,
  mdiPencil,
  mdiDelete,
  mdiDownload,
  mdiTruckDeliveryOutline,
  mdiPackageVariantClosedCheck,
  mdiCancel,
} from "@mdi/js";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { Users } from "@/modules/users/infrastructure/usersService";

interface Filter {
  cadete_id: string;
  sender_city: string;
  sender_neighborhood: string;
  receiver_city: string;
  receiver_neighborhood: string;
  status: string;
  created_at: string;
  pickup_datetime: string;
}

// === DEBUG ===
const DEBUG_WAYBILLS = true;

// Wrapper para loguear todo lo que le mandamos/recibimos al llamar Pagination
const PaginationDebug = async (
  page: number,
  perPage: number,
  searchText: string,
  token: string,
  filterP: any
) => {
  if (DEBUG_WAYBILLS) {
    console.groupCollapsed(
      `%c[Pagination] CALL page=${page} q="${searchText}"`,
      "color:#1976d2;font-weight:600"
    );
    console.log("filterP (enviado):", JSON.parse(JSON.stringify(filterP)));
    console.groupEnd();
  }
  const res = await Pagination(page, perPage, searchText, token, filterP);
  if (DEBUG_WAYBILLS) {
    console.groupCollapsed(`%c[Pagination] RESPONSE page=${page}`, "color:#2e7d32;font-weight:600");
    console.log("total_pages:", res?.total_pages);
    console.log("items:", Array.isArray(res?.data) ? res.data.length : res?.data);
    if (Array.isArray(res?.data)) {
      console.table(
        res.data.map((x: any) => ({
          id: x.id,
          pickup_datetime: x.pickup_datetime,
          delivery_date: x.delivery_date,
          delivery_hour: x.delivery_hour,
          status: x.status,
        }))
      );
    }
    console.groupEnd();
  }
  return res;
};

// helpers que ya venías usando
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function normalizeToDDMMYYYY(input: any): string {
  if (!input) return "";
  if (input instanceof Date && !isNaN(input.getTime())) {
    return `${pad(input.getDate())}-${pad(input.getMonth() + 1)}-${input.getFullYear()}`;
  }
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-");
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    const [y, m, d] = str.split("/");
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${d}-${m}-${y}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return `${pad(parsed.getDate())}-${pad(parsed.getMonth() + 1)}-${parsed.getFullYear()}`;
  }
  return "";
}

export default function UsersPage() {
  const role = useSelector((state: any) => state.auth.role);
  const user_id = useSelector((state: any) => state.auth.id);
  const [data, setData] = useState<any[]>([]);
  const [createUrl, setCreateUrl] = useState("/waybills/create");
  const [filter, setFilter] = useState<Filter>({
    cadete_id: "",
    sender_city: "",
    sender_neighborhood: "",
    receiver_city: "",
    receiver_neighborhood: "",
    status: "",
    created_at: "",
    pickup_datetime: "",
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Extraemos ?page=… de la URL; si no viene, usamos 1
  const params = new URLSearchParams(location.search);
  const initialPage = parseInt(params.get("page") || "1", 10);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const token = useSelector((state: any) => state.auth.token);
  const [search, setSearch] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectArray, setSelectArray] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectCadeteTemp, setSelectCadete] = useState({ id: "", name: "" });
  const [selectWaybill, setSelectWaybill] = useState("");

  /* =========================================
   Datos + filtros (normalización de fechas) + LOGS
   ========================================= */
  const fetchUsers = async (page = 1, searchText = "", filterTemp: any = {}) => {
    try {
      const filterP: any = {};
      const activeFilter = Object.keys(filterTemp).length > 0 ? filterTemp : filter;

      // LOG: lo que viene desde la URL/estado
      if (DEBUG_WAYBILLS) {
        console.groupCollapsed("%c[fetchUsers] filtros de entrada", "color:#6a1b9a;font-weight:600");
        console.log("page:", page, "search:", searchText);
        console.log("activeFilter:", JSON.parse(JSON.stringify(activeFilter)));
        console.groupEnd();
      }

      // created_at (Fecha de recogida) desde input type="date" (YYYY-MM-DD)
      if ((activeFilter as any).created_at) {
        const day = normalizeToDDMMYYYY((activeFilter as any).created_at); // "DD-MM-YYYY"
        const [dd, mm, yyyy] = day.split("-");

        // Hora en Z (UTC) de inicio/fin del día
        const isoStart = `${yyyy}-${mm}-${dd}T00:00:00Z`;
        const isoEnd = `${yyyy}-${mm}-${dd}T23:59:59Z`;

        // 🔹 Enviamos TODAS las variantes razonables:
        filterP.pickup_after = isoStart;
        filterP.pickup_before = isoEnd;

        filterP.after = isoStart;
        filterP.before = isoEnd;

        filterP.pickup_datetime_after = isoStart;
        filterP.pickup_datetime_before = isoEnd;

        filterP.pickup_date = `${yyyy}-${mm}-${dd}`;
        filterP.pickup_day = day;
      }

      // pickup_datetime (Fecha de entrega) desde input type="date" (YYYY-MM-DD)
      if ((activeFilter as any).pickup_datetime) {
        const day = normalizeToDDMMYYYY((activeFilter as any).pickup_datetime);
        const [dd, mm, yyyy] = day.split("-");
        filterP.delivery_after = `${yyyy}-${mm}-${dd}T00:00:00Z`;
        filterP.delivery_before = `${yyyy}-${mm}-${dd}T23:59:59Z`;
      }

      // Otros filtros (ciudad, barrio, cadete, etc.)
      Object.entries(activeFilter).forEach(([key, val]) => {
        if (val !== "" && key !== "created_at" && key !== "pickup_datetime" && key !== "status") {
          (filterP as any)[key] = val;
        }
      });

      // Estado (por defecto excluimos Cancelado si no eligen status)
      if ((activeFilter as any).status) {
        filterP.status = (activeFilter as any).status;
      } else {
        filterP.exclude_status = "Cancelado";
      }

      // LOG: lo que realmente enviamos al backend
      if (DEBUG_WAYBILLS) {
        console.groupCollapsed("%c[fetchUsers] filterP ENVIADO a la API", "color:#ef6c00;font-weight:600");
        console.log(JSON.parse(JSON.stringify(filterP)));
        console.groupEnd();
      }

      // Llamamos con el wrapper para ver la respuesta
      const response: any = await PaginationDebug(page, 10, searchText, token, filterP);

      // === mapeo actualizado para manejar cadete correctamente ===
      const mapped = (response?.data || []).map((item: any) => {
        const pickupParts = String(item.pickup_datetime || "").split(" ");
        const pickupDayRaw = pickupParts[0] || "";
        const pickupDay = normalizeToDDMMYYYY(pickupDayRaw);
        const pickupHour = pickupParts.length > 1 ? pickupParts.slice(1).join(" ") : "";

        const deliveryDay = normalizeToDDMMYYYY(item.delivery_date || "");
        const deliveryHour = item.delivery_hour || "";
        const delivery = deliveryDay ? `${deliveryDay}${deliveryHour ? ` ${deliveryHour}` : ""}` : "";

        // Inicialmente intentamos resolver nombre desde distintos campos que el backend pueda devolver:
        let cadeteName = "";
        if (item.cadete && (item.cadete.name || item.cadete.user_name)) {
          cadeteName = item.cadete.name || item.cadete.user_name;
        } else if (item.cadete_name) {
          cadeteName = item.cadete_name;
        } else if (item.rider_name) {
          cadeteName = item.rider_name;
        } else if (item.cadete_id) {
          // mostramos el id abreviado temporalmente
          const s = String(item.cadete_id || "");
          cadeteName = s ? `#${s.substring(0, 6)}...` : "No asignado";
        } else {
          cadeteName = "No asignado";
        }

        return {
          ...item,
          receiver_phone: item.receiver?.phone || "",
          sender_phone: item.sender?.phone || "",
          pickup_datetime: `${pickupDay}${pickupHour ? ` ${pickupHour}` : ""}`,
          delivery_datetime: delivery,
          cadete_name: cadeteName || "—",
        };
      });

      // ===== Si hay cadete_id sin nombre, tratamos de resolverlos consultando Users.getCadetes (una sola llamada) =====
      const idsToResolve = Array.from(
        new Set(
          mapped
            .filter((m: any) => {
              if (!m.cadete_id) return false;
              const cn = String(m.cadete_name || "");
              return cn.startsWith("#") || cn === "No asignado" || cn === "—";
            })
            .map((m: any) => String(m.cadete_id))
        )
      );

      if (idsToResolve.length > 0 && Users && typeof (Users as any).getCadetes === "function") {
        try {
          // intentamos traer listado de cadetes (vacío = todos / backend puede paginar)
          const cadRes: any = await (Users as any).getCadetes("", token);
          const cadList: any[] = cadRes?.data || cadRes || [];

          const idNameMap: Record<string, string> = {};
          cadList.forEach((c: any) => {
            const cid = String(c.id || c._id || c.user_id || c.userId || "");
            const name = c.name || c.user_name || c.email || c.displayName || "";
            if (cid) idNameMap[cid] = name || cid;
          });

          const mappedResolved = mapped.map((m: any) => {
            if (m.cadete_id && idNameMap[String(m.cadete_id)]) {
              return { ...m, cadete_name: idNameMap[String(m.cadete_id)] };
            }
            return m;
          });

          setData(mappedResolved);
        } catch (errCad) {
          if (DEBUG_WAYBILLS) {
            console.warn("[fetchUsers] getCadetes fallo, usando mapped sin resolver ids:", errCad);
          }
          setData(mapped);
        }
      } else {
        setData(mapped);
      }

      setTotalPages(response?.total_pages || 1);

      // LOG: resumen post-mapeo
      if (DEBUG_WAYBILLS) {
        console.groupCollapsed("%c[fetchUsers] RESULTADO mostrado en tabla", "color:#455a64;font-weight:600");
        console.table(
          (response?.data || []).slice(0, 10).map((x: any) => ({
            id: x.id,
            pickup_datetime: x.pickup_datetime,
            delivery_datetime: x.delivery_datetime,
            status: x.status,
            cadete_name: x.cadete_name || x.cadete?.name || x.cadete_id,
          }))
        );
        console.groupEnd();
      }
    } catch (error) {
      console.error("Error al obtener guías:", error);
    }
  };

  /* ===========================
     URL -> estado (page + filtros)
     =========================== */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page") || "1", 10);

    const urlFilter: Partial<Filter> = {};
    [
      "status",
      "created_at",
      "pickup_datetime",
      "cadete_id",
      "sender_city",
      "sender_neighborhood",
      "receiver_city",
      "receiver_neighborhood",
    ].forEach((key) => {
      const val = params.get(key);
      if (val !== null) urlFilter[key as keyof Filter] = val;
    });

    setCurrentPage(page);
    setFilter((f) => ({ ...f, ...urlFilter }));
    fetchUsers(page, search, { ...filter, ...urlFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (role == "Cadete") {
      setCreateUrl("");
    }
    // Llamada inicial
    fetchUsers(currentPage, search, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     Acciones de la grilla
     =========================== */
  const handleCancel = async (id: string) => {
    try {
      await Waybills.cancel(id, token);
      await fetchUsers(currentPage);
      Swal.fire("¡Guía cancelada!", "", "success");
    } catch (error) {
      console.error("Error al cancelar guía:", error);
      Swal.fire("Error", "No se pudo cancelar la guía.", "error");
    }
  };

  const selectCadete = async (id: string) => {
    try {
      setSelectWaybill(id);
      // pre-cargar cadetes para que el modal no aparezca vacío
      await handleSearch("");
      setModalVisible(true);
    } catch (error) {
      console.error("Error al abrir modal selección cadete:", error);
      setModalVisible(true);
    }
  };

  const confirmPackageDelivery = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: "Paquete entregado?",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "Cancelar",
        icon: "question",
      });
      if (result.isConfirmed) {
        Swal.fire({
          title: "",
          text: "Cargando...",
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const historySet = await Waybills.historySet(id, { status: "Entregado", location: "" }, token);
        if (historySet && typeof historySet.id !== "undefined") {
          pagination(currentPage);
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Se cambió el estado del envío.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el estado del envío.",
          });
        }
      } else if (result.isDismissed) {
        console.log("El paquete no fue recibido.");
      }
    } catch (error) {
      console.error("Error al cambiar el estado del paquete:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un problema al procesar la solicitud.",
      });
    }
  };

  const confirmPayment = async (id: string, who_pays: string) => {
    try {
      const dataPayment = {
        payment_status: "Pagado",
        payment_reference: role + "-" + user_id,
        payment_method: "Efectivo",
      };

      const result = await Swal.fire({
        title: "¿Confirma que recibió el pago?",
        text: who_pays + " realizó el pago. Por favor, confirme.",
        showCancelButton: true,
        confirmButtonText: "Sí, confirmar",
        cancelButtonText: "Cancelar",
        icon: "question",
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "",
          text: "Cargando...",
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const historySet = await Waybills.payment(id, dataPayment, token);

        if (historySet && typeof historySet.id !== "undefined") {
          pagination(currentPage);
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "El estado del pago se cambió correctamente.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el estado del pago.",
          });
        }
      } else if (result.isDismissed) {
        console.log("La confirmación del pago fue cancelada.");
      }
    } catch (error) {
      console.error("Error al cambiar el estado del pago:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un problema al procesar la solicitud.",
      });
    }
  };

  // Confirmación de cancelación (usada por clientes)
  const confirmCancel = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de cancelar esta guía?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;

    Swal.fire({
      title: "",
      text: "Cancelando...",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await handleCancel(id);
      Swal.fire("¡Guía cancelada!", "", "success");
      pagination(currentPage);
    } catch (err) {
      Swal.fire("Error", "No se pudo cancelar la guía.", "error");
    }
  };

  const searchHandler = async (value: string, filter = {}) => {
    fetchUsers(1, value);
    setSearch(value);
  };

  const pagination = async (pag: number = 1, filterTem: Partial<Filter> = filter) => {
    setCurrentPage(pag);

    const params = new URLSearchParams();
    params.set("page", String(pag));
    Object.entries(filterTem).forEach(([key, val]) => {
      if (val && typeof val === "string") {
        params.set(key, val);
      }
    });

    navigate(`?${params.toString()}`, { replace: false });

    await fetchUsers(pag, search, filterTem);
  };

  const downloadExcel = async () => {
    try {
      const res = await Waybills.exel(search, filter, token);
      if (res && res.data) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(res.data);
        XLSX.utils.book_append_sheet(wb, ws, "Waybills");
        XLSX.writeFile(wb, "waybills.xlsx");
      } else {
        Swal.fire("Info", "No hay datos para exportar", "info");
      }
    } catch (err) {
      console.error("Error exportando excel:", err);
      Swal.fire("Error", "No se pudo descargar el Excel.", "error");
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    params.set("page", "1");

    Object.entries(filter).forEach(([key, val]) => {
      if (val) {
        params.set(key, val as string);
      }
    });

    navigate(`?${params.toString()}`, { replace: false });

    setIsFilterModalOpen(false);
  };

  // Asignar cadete desde modal: aseguramos asignación y forzamos estado "Aceptado"
  const setSelectUserTemp = async (value: any) => {
    Swal.fire({
      title: "",
      text: "Cargando...",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      setSelectCadete(value);

      // 1) Intentamos la llamada habitual que tenías
      const assignResp: any = await Waybills.cadeteSet(selectWaybill, { cadete_id: value.id }, token);

      const okAssign =
        !!assignResp &&
        (typeof assignResp.id !== "undefined" || assignResp.success === true || assignResp.ok === true || assignResp === true);

      if (!okAssign && DEBUG_WAYBILLS) {
        console.warn("Waybills.cadeteSet no devolvió confirmación:", assignResp);
      }

      // 2) Aseguramos que además se actualice el estado de la guía.
      try {
        const payload: any = {
          cadete_id: value.id,
          cadete_name: value.name || value.user_name || value.email || "",
          status: "Aceptado",
        };

        const putResp: any = await Waybills.put(selectWaybill, payload, token);

        const okPut =
          !!putResp &&
          (typeof putResp.id !== "undefined" || putResp.success === true || putResp.ok === true || putResp === true);

        if (!okPut) {
          if (DEBUG_WAYBILLS) console.warn("Waybills.put no confirmó el update:", putResp);
          // fallback to historySet
          await Waybills.historySet(selectWaybill, { status: "Aceptado", note: "Asignado por admin" }, token);
        }
      } catch (errPut) {
        if (DEBUG_WAYBILLS) console.warn("PUT fallo, intentando historySet fallback:", errPut);
        try {
          await Waybills.historySet(selectWaybill, { status: "Aceptado", note: "Asignado por admin (fallback)" }, token);
        } catch (errHist) {
          if (DEBUG_WAYBILLS) console.error("historySet fallback tambien falló:", errHist);
        }
      }

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Se asignó el cadete al envío",
      }).then(() => {
        setModalVisible(false);
        pagination(currentPage);
      });
    } catch (err: any) {
      if (DEBUG_WAYBILLS) console.error("setSelectUserTemp error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.message || err?.mensaje || "No se pudo asignar el cadete",
      });
    }
  };

  // Desasignar cadete: deja la guía disponible nuevamente y pone status a "Procesando"
  const unassignCadete = async (waybillId: string, currentCadeteId?: string) => {
    const result = await Swal.fire({
      title: "¿Desasignar cadete?",
      text: "La guía quedará disponible para volver a asignarse.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Desasignar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    Swal.fire({
      title: "",
      text: "Desasignando...",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // 1) Intentamos endpoint específico si existe
      let resp: any = null;
      try {
        resp = await Waybills.cadeteSet(waybillId, { cadete_id: "" }, token);
      } catch (errCad) {
        if (DEBUG_WAYBILLS) console.warn("cadeteSet fallo en unassign:", errCad);
      }

      // 2) Forceamos update para garantizar status y limpiar campos
      try {
        const payload: any = {
          cadete_id: "",
          cadete_name: "",
          status: "Procesando",
        };
        const putResp: any = await Waybills.put(waybillId, payload, token);
        if (!(putResp && (typeof putResp.id !== "undefined" || putResp.ok || putResp.success))) {
          // fallback a historySet si put no confirma
          await Waybills.historySet(waybillId, { status: "Procesando", note: "Desasignado por admin" }, token);
        }
      } catch (errPut) {
        if (DEBUG_WAYBILLS) console.warn("PUT fallo en unassign, intentando historySet:", errPut);
        try {
          await Waybills.historySet(waybillId, { status: "Procesando", note: "Desasignado por admin (fallback)" }, token);
        } catch (errHist) {
          if (DEBUG_WAYBILLS) console.error("historySet fallback fallo en unassign:", errHist);
        }
      }

      Swal.fire({
        icon: "success",
        title: "¡Desasignado!",
        text: "La guía quedó disponible nuevamente.",
      }).then(() => {
        pagination(currentPage);
      });
    } catch (err) {
      console.error("Error desasignando cadete:", err);
      Swal.fire("Error", "No se pudo desasignar el cadete.", "error");
    }
  };

  const handleSearch = async (text: string) => {
    try {
      let selectArryTemp = await Users.getCadetes(text, token);
      setSelectArray(selectArryTemp?.data || selectArryTemp || []);
    } catch (err) {
      console.error("Error fetching cadetes:", err);
      setSelectArray([]);
    }
  };

  const columns = [
    "company_name",
    "sender_address",
    "receiver_address",
    "receiver_phone",
    "sender_phone",
    "cadete_name",
    "status",
    "shipping_cost",
    "pickup_datetime",
    "delivery_datetime",
  ];

  const titles = [
    "Empresa",
    "Direccion de origen",
    "Direccion de destino",
    "Teléfono destinatario",
    "Teléfono remitente",
    "Cadete asignado",
    "Estado",
    "Precio",
    "Fecha recogida",
    "Fecha de entrega",
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const isCadete = role === "Cadete";
  const isCliente = role === "Cliente";

  const filterObject = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <div className="w-full">
        <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">
          Estado
        </label>
        <select
          id="status"
          value={filter.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="block w-full py-2 pl-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Todos los estados</option>
          {!isCadete && <option value="Procesando">Procesando</option>}
          <option value="Aceptado">Aceptado</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {!isCadete && !isCliente && (
        <div className="w-full">
          <SelectCadete
            token={token}
            value={filter.cadete_id}
            set={(value: any) => handleFilterChange("cadete_id", value)}
          />
        </div>
      )}

      <div className="w-full">
        <label htmlFor="created_at" className="block mb-2 text-sm font-medium text-gray-700">
          Fecha de Recogida
        </label>
        <input
          type="date"
          id="created_at"
          value={filter.created_at}
          onChange={(e) => handleFilterChange("created_at", e.target.value)}
          className="block w-full py-2 pl-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="w-full">
        <label htmlFor="pickup_datetime" className="block mb-2 text-sm font-medium text-gray-700">
          Fecha de Entrega
        </label>
        <input
          type="date"
          id="pickup_datetime"
          value={filter.pickup_datetime}
          onChange={(e) => handleFilterChange("pickup_datetime", e.target.value)}
          className="block w-full py-2 pl-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  );

  const handleFilterRemoval = async (key: string) => {
    const updatedFilter = { ...filter, [key]: "" };
    setFilter(updatedFilter);
    pagination(1, updatedFilter);
  };

  const handleAction = (row: any) => {
    // Determinamos si la guía está asignada a un cadete válido
    const assigned = !!row.cadete_id && row.cadete_id !== "" && row.cadete_id !== "000000000000000000000000";

    // Editar: Cliente y Admin pueden editar mientras NO esté asignada a cadete y el estado sea Procesando
    const showEdit =
      (role === "Cliente" || role === "Admin" || role === "Super Admin") &&
      row.status === "Procesando" &&
      !assigned;

    // Asignar: solo Admin/SuperAdmin y solo si NO está asignada y no está entregada ni pagada
    const canAssign =
      (role === "Admin" || role === "Super Admin") &&
      !assigned &&
      row.status !== "Entregado" &&
      row.payment_status !== "Pagado";

    // Desasignar: solo Admin/SuperAdmin y si está asignada
    const canUnassign = (role === "Admin" || role === "Super Admin") && assigned;

    return (
      <>
        <button
          type="button"
          title="Ver informacion"
          onClick={() => navigate(`/waybills/view/${row.id}?page=${currentPage}`)}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2  me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          <Icon path={mdiEye} size={1} />
        </button>

        {showEdit && (
          <button
            type="button"
            title="Editar"
            onClick={() => navigate(`/waybills/edit/${row.id}`)}
            className="text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2"
          >
            <Icon path={mdiPencil} size={1} />
          </button>
        )}

        {(role === "Super Admin" || role === "Cliente" || (role === "Admin" && (!row.cadete_id || row.cadete_id === "000000000000000000000000"))) &&
          row.status === "Procesando" &&
          !assigned && (
            <button
              type="button"
              title="Cancelar"
              onClick={() => confirmCancel(row.id)}
              className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2"
            >
              <Icon path={mdiDelete} size={1} />
            </button>
          )}

        {canAssign && (
          <button
            type="button"
            title="Selecciona cadete"
            onClick={() => selectCadete(row.id)}
            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2"
          >
            <Icon path={mdiTruckDeliveryOutline} size={1} />
          </button>
        )}

        {canUnassign && (
          <button
            type="button"
            title="Desasignar cadete"
            onClick={() => unassignCadete(row.id, row.cadete_id)}
            className="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2"
          >
            <Icon path={mdiCancel} size={1} />
          </button>
        )}

        {role === "Cadete" && row.status === "Aceptado" && (
          <button
            type="button"
            title="Confirmar entrega"
            onClick={() => confirmPackageDelivery(row.id)}
            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2"
          >
            <Icon path={mdiPackageVariantClosedCheck} size={1} />
          </button>
        )}

        {(role === "Cadete" || role === "Super Admin" || role === "Admin") && row.payment_status !== "Pagado" && (
          <button
            type="button"
            title="Confirmar pago"
            onClick={() => confirmPayment(row.id, row.who_pays)}
            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 me-2 mb-2"
          >
            <Icon path={mdiCash} size={1} />
          </button>
        )}
      </>
    );
  };

  // Chips con filtros activos
  const filterDisplay = Object.keys(filter).map((key) => {
    if ((filter as any)[key]) {
      return (
        <span key={key} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full mr-2 mb-2 inline-flex items-center">
          {(filter as any)[key]}
          <button onClick={() => handleFilterRemoval(key)} className="ml-2 text-red-600">
            x
          </button>
        </span>
      );
    }
    return null;
  });

  const filterBtn = (
    <div className="flex items-center">
      <button
        onClick={() => setIsFilterModalOpen(true)}
        className="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-2 py-2"
      >
        Filtrar
      </button>
      <button onClick={() => downloadExcel()} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-2 py-1.5 ml-4">
        <Icon path={mdiDownload} size={1} />
      </button>
      <div className="ml-4 flex flex-wrap">{filterDisplay}</div>
    </div>
  );

  const modalFilter = (
    <Modal isOpen={isFilterModalOpen} onRequestClose={() => setIsFilterModalOpen(false)} contentLabel="Filtros" className="modal-content w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Filtrar datos</h2>
      {filterObject}
      <div className="flex justify-end mt-4">
        <button onClick={() => setIsFilterModalOpen(false)} className="text-white bg-gray-600 hover:bg-gray-700 font-medium rounded-lg text-sm px-4 py-2">
          Cerrar
        </button>
        <button onClick={applyFilters} className="ml-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2">
          Aplicar filtros
        </button>
      </div>
    </Modal>
  );

  return (
    <Layout>
      {modalFilter}
      <ModalSelect
        visible={modalVisible}
        title="Selecciona un cadete"
        placeholder="Nombre  o email"
        titles={["Nombre", "Email"]}
        columns={["name", "email"]}
        data={selectArray}
        set={setSelectUserTemp}
        search={handleSearch}
        setVisible={setModalVisible}
        pag={currentPage}
        totalPag={totalPages}
      />
      <Table
        titles={titles}
        columns={columns}
        data={data}
        pag={currentPage}
        totalPag={totalPages}
        onPageChange={(page) => pagination(page)}
        action={handleAction}
        searchPag={searchHandler}
        searchPlaceholder="Número, nombre de la empresa o dirección"
        create={createUrl}
        filter={filterBtn}
      />
    </Layout>
  );
}
