import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { computeAlerts, Alert } from "../utils/alerts";
import { Stage } from "../utils/baseline";

export type { Stage };

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  budget: number;
  area: number;
  floors: number;
  buildType: "Basic" | "Standard" | "Premium";
  stage: Stage;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  purchased: number;
  delivered: number;
  used: number;
  totalCost: number;
  photoUri?: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: "purchase" | "delivery" | "usage";
  materialId: string;
  materialName: string;
  quantity: number;
  cost?: number;
  date: string;
  notes?: string;
  photoUri?: string;
  stage?: Stage;
  supplierId?: string;
  supplierName?: string;
}

export interface DeliveryOptions {
  cost?: number;
  notes?: string;
  photoUri?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  category: string;
  notes?: string;
}

export interface SiteReport {
  id: string;
  date: string;
  workers: number;
  workDone: string;
  incidents?: string;
  stage: Stage;
  photoUri?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  recipient: string;
  type: "fundi" | "casual" | "contractor" | "other";
  description?: string;
  stage: Stage;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  uri: string;
  caption?: string;
  stage: Stage;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const K = {
  projects: "bg_v2_projects",
  active: "bg_v2_active",
  materials: (id: string) => `bg_v2_materials_${id}`,
  transactions: (id: string) => `bg_v2_transactions_${id}`,
  suppliers: (id: string) => `bg_v2_suppliers_${id}`,
  reports: (id: string) => `bg_v2_reports_${id}`,
  payments: (id: string) => `bg_v2_payments_${id}`,
  photos: (id: string) => `bg_v2_photos_${id}`,
};

// ─── Default data ────────────────────────────────────────────────────────────

const DEFAULT_MAT_DEFS = [
  { name: "Cement", unit: "bags" },
  { name: "Steel", unit: "kg" },
  { name: "Sand", unit: "m³" },
  { name: "Ballast", unit: "m³" },
];

function makeMaterials(defs: { name: string; unit: string }[]): Material[] {
  return defs.map((d) => ({
    id: d.name.toLowerCase().replace(/\s+/g, "_"),
    name: d.name,
    unit: d.unit,
    purchased: 0,
    delivered: 0,
    used: 0,
    totalCost: 0,
  }));
}

const DEMO_MATERIALS: Material[] = makeMaterials(DEFAULT_MAT_DEFS).map((m) =>
  m.id === "cement"
    ? { ...m, purchased: 120, delivered: 100, used: 90, totalCost: 360000 }
    : m
);

const DEMO_TXS = (stage: Stage): Transaction[] => [
  { id: "t1", type: "purchase", materialId: "cement", materialName: "Cement", quantity: 120, cost: 360000, date: new Date(Date.now() - 7 * 86400000).toISOString(), notes: "Purchased from Bamburi — 50kg bags", stage, supplierName: "Bamburi Cement Ltd" },
  { id: "t2", type: "delivery", materialId: "cement", materialName: "Cement", quantity: 100, date: new Date(Date.now() - 5 * 86400000).toISOString(), notes: "Truck 1: 60 bags, Truck 2: 40 bags", stage },
  { id: "t3", type: "usage", materialId: "cement", materialName: "Cement", quantity: 90, date: new Date(Date.now() - 2 * 86400000).toISOString(), notes: "Foundation slab pour", stage },
];

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ─── Context Interface ───────────────────────────────────────────────────────

interface AppContextValue {
  project: Project | null;
  materials: Material[];
  transactions: Transaction[];
  alerts: Alert[];
  isLoading: boolean;
  hasProject: boolean;
  totalSpent: number;
  totalLabourCost: number;
  allProjects: Project[];
  // Project
  createProject: (data: Omit<Project, "id" | "createdAt">) => Promise<void>;
  switchProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, data: Partial<Omit<Project, "id" | "createdAt">>) => Promise<void>;
  setStage: (stage: Stage) => Promise<void>;
  setupProject: (data: Omit<Project, "id" | "createdAt">) => Promise<void>;
  // Materials
  addMaterial: (data: { name: string; unit: string; photoUri?: string }) => Promise<void>;
  updateMaterial: (id: string, data: { name: string; unit: string; photoUri?: string }) => Promise<void>;
  deleteMaterial: (id: string) => Promise<boolean>;
  getMaterial: (id: string) => Material | undefined;
  getMaterialTransactions: (materialId: string) => Transaction[];
  // Logging
  logPurchase: (materialId: string, quantity: number, cost: number, notes?: string, supplierId?: string) => Promise<void>;
  logDelivery: (materialId: string, quantity: number, options?: DeliveryOptions) => Promise<void>;
  logUsage: (materialId: string, quantity: number, notes?: string) => Promise<void>;
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, "id">) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Omit<Supplier, "id">>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplierTransactions: (supplierId: string) => Transaction[];
  // Site reports
  siteReports: SiteReport[];
  addSiteReport: (data: Omit<SiteReport, "id">) => Promise<void>;
  deleteSiteReport: (id: string) => Promise<void>;
  // Payments
  payments: Payment[];
  addPayment: (data: Omit<Payment, "id">) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  // Progress photos
  progressPhotos: ProgressPhoto[];
  addProgressPhoto: (data: Omit<ProgressPhoto, "id">) => Promise<void>;
  deleteProgressPhoto: (id: string) => Promise<void>;
  // Legacy
  resetProject: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [siteReports, setSiteReports] = useState<SiteReport[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjectData = async (pid: string) => {
    const [mRaw, tRaw, sRaw, rRaw, pRaw, phRaw] = await Promise.all([
      AsyncStorage.getItem(K.materials(pid)),
      AsyncStorage.getItem(K.transactions(pid)),
      AsyncStorage.getItem(K.suppliers(pid)),
      AsyncStorage.getItem(K.reports(pid)),
      AsyncStorage.getItem(K.payments(pid)),
      AsyncStorage.getItem(K.photos(pid)),
    ]);
    return {
      materials: mRaw ? JSON.parse(mRaw) : [],
      transactions: tRaw ? JSON.parse(tRaw) : [],
      suppliers: sRaw ? JSON.parse(sRaw) : [],
      siteReports: rRaw ? JSON.parse(rRaw) : [],
      payments: pRaw ? JSON.parse(pRaw) : [],
      progressPhotos: phRaw ? JSON.parse(phRaw) : [],
    };
  };

  const applyProjectData = (data: Awaited<ReturnType<typeof loadProjectData>>) => {
    setMaterials(data.materials);
    setTransactions(data.transactions);
    setSuppliers(data.suppliers);
    setSiteReports(data.siteReports);
    setPayments(data.payments);
    setProgressPhotos(data.progressPhotos);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRaw, activeRaw] = await Promise.all([
          AsyncStorage.getItem(K.projects),
          AsyncStorage.getItem(K.active),
        ]);
        if (projectsRaw) {
          const projects: Project[] = JSON.parse(projectsRaw);
          setAllProjects(projects);
          const activeId = activeRaw ?? projects[0]?.id ?? null;
          if (activeId) {
            setActiveProjectId(activeId);
            const data = await loadProjectData(activeId);
            applyProjectData(data);
          }
        } else {
          // Legacy migration
          const [legacyProject, legacyMaterials, legacyTx] = await Promise.all([
            AsyncStorage.getItem("bg_project"),
            AsyncStorage.getItem("bg_materials"),
            AsyncStorage.getItem("bg_transactions"),
          ]);
          if (legacyProject) {
            const p: Project = { ...JSON.parse(legacyProject), createdAt: new Date().toISOString() };
            const m: Material[] = legacyMaterials ? JSON.parse(legacyMaterials) : [];
            const t: Transaction[] = legacyTx ? JSON.parse(legacyTx) : [];
            await Promise.all([
              AsyncStorage.setItem(K.projects, JSON.stringify([p])),
              AsyncStorage.setItem(K.active, p.id),
              AsyncStorage.setItem(K.materials(p.id), JSON.stringify(m)),
              AsyncStorage.setItem(K.transactions(p.id), JSON.stringify(t)),
            ]);
            await AsyncStorage.multiRemove(["bg_project", "bg_materials", "bg_transactions"]);
            setAllProjects([p]);
            setActiveProjectId(p.id);
            setMaterials(m);
            setTransactions(t);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const project = useMemo(
    () => allProjects.find((p) => p.id === activeProjectId) ?? null,
    [allProjects, activeProjectId]
  );

  // ─── Persistence helpers ─────────────────────────────────────────────────

  const persistProjects = useCallback(async (projects: Project[]) => {
    await AsyncStorage.setItem(K.projects, JSON.stringify(projects));
  }, []);

  const persistData = useCallback(async (pid: string, m: Material[], t: Transaction[]) => {
    await Promise.all([
      AsyncStorage.setItem(K.materials(pid), JSON.stringify(m)),
      AsyncStorage.setItem(K.transactions(pid), JSON.stringify(t)),
    ]);
  }, []);

  const persistSuppliers = useCallback(async (pid: string, s: Supplier[]) => {
    await AsyncStorage.setItem(K.suppliers(pid), JSON.stringify(s));
  }, []);

  const persistReports = useCallback(async (pid: string, r: SiteReport[]) => {
    await AsyncStorage.setItem(K.reports(pid), JSON.stringify(r));
  }, []);

  const persistPayments = useCallback(async (pid: string, p: Payment[]) => {
    await AsyncStorage.setItem(K.payments(pid), JSON.stringify(p));
  }, []);

  const persistPhotos = useCallback(async (pid: string, ph: ProgressPhoto[]) => {
    await AsyncStorage.setItem(K.photos(pid), JSON.stringify(ph));
  }, []);

  // ─── Project Management ──────────────────────────────────────────────────

  const createProject = useCallback(
    async (data: Omit<Project, "id" | "createdAt">) => {
      const isDemo = data.area === 200;
      const newProject: Project = { ...data, id: genId(), createdAt: new Date().toISOString() };
      const mats = isDemo ? DEMO_MATERIALS : makeMaterials(DEFAULT_MAT_DEFS);
      const txs = isDemo ? DEMO_TXS(data.stage) : [];
      const newProjects = [...allProjects, newProject];
      await Promise.all([
        persistProjects(newProjects),
        AsyncStorage.setItem(K.active, newProject.id),
        AsyncStorage.setItem(K.materials(newProject.id), JSON.stringify(mats)),
        AsyncStorage.setItem(K.transactions(newProject.id), JSON.stringify(txs)),
      ]);
      setAllProjects(newProjects);
      setActiveProjectId(newProject.id);
      setMaterials(mats);
      setTransactions(txs);
      setSuppliers([]);
      setSiteReports([]);
      setPayments([]);
      setProgressPhotos([]);
    },
    [allProjects, persistProjects]
  );

  const switchProject = useCallback(async (id: string) => {
    await AsyncStorage.setItem(K.active, id);
    setActiveProjectId(id);
    const data = await loadProjectData(id);
    applyProjectData(data);
  }, []);

  const deleteProject = useCallback(
    async (id: string) => {
      const newProjects = allProjects.filter((p) => p.id !== id);
      await Promise.all([
        persistProjects(newProjects),
        AsyncStorage.multiRemove([
          K.materials(id), K.transactions(id), K.suppliers(id),
          K.reports(id), K.payments(id), K.photos(id),
        ]),
      ]);
      setAllProjects(newProjects);
      if (activeProjectId === id) {
        const next = newProjects[0];
        if (next) {
          await switchProject(next.id);
        } else {
          setActiveProjectId(null);
          setMaterials([]); setTransactions([]); setSuppliers([]);
          setSiteReports([]); setPayments([]); setProgressPhotos([]);
          await AsyncStorage.removeItem(K.active);
        }
      }
    },
    [allProjects, activeProjectId, persistProjects, switchProject]
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Omit<Project, "id" | "createdAt">>) => {
      const newProjects = allProjects.map((p) => (p.id === id ? { ...p, ...data } : p));
      await persistProjects(newProjects);
      setAllProjects(newProjects);
    },
    [allProjects, persistProjects]
  );

  const setStage = useCallback(
    async (stage: Stage) => {
      if (activeProjectId) await updateProject(activeProjectId, { stage });
    },
    [activeProjectId, updateProject]
  );

  const setupProject = createProject;

  // ─── Material Management ─────────────────────────────────────────────────

  const addMaterial = useCallback(
    async (data: { name: string; unit: string; photoUri?: string }) => {
      if (!activeProjectId) return;
      const newMat: Material = { id: genId(), ...data, name: data.name.trim(), unit: data.unit.trim(), purchased: 0, delivered: 0, used: 0, totalCost: 0, isCustom: true };
      const newMats = [...materials, newMat];
      setMaterials(newMats);
      await persistData(activeProjectId, newMats, transactions);
    },
    [activeProjectId, materials, transactions, persistData]
  );

  const updateMaterial = useCallback(
    async (id: string, data: { name: string; unit: string; photoUri?: string }) => {
      if (!activeProjectId) return;
      const newMats = materials.map((m) => m.id === id ? { ...m, name: data.name.trim(), unit: data.unit.trim(), photoUri: data.photoUri ?? m.photoUri } : m);
      const newTxs = transactions.map((t) => t.materialId === id ? { ...t, materialName: data.name.trim() } : t);
      setMaterials(newMats);
      setTransactions(newTxs);
      await persistData(activeProjectId, newMats, newTxs);
    },
    [activeProjectId, materials, transactions, persistData]
  );

  const deleteMaterial = useCallback(
    async (id: string): Promise<boolean> => {
      if (!activeProjectId) return false;
      if (transactions.some((t) => t.materialId === id)) return false;
      const newMats = materials.filter((m) => m.id !== id);
      setMaterials(newMats);
      await persistData(activeProjectId, newMats, transactions);
      return true;
    },
    [activeProjectId, materials, transactions, persistData]
  );

  const getMaterial = useCallback((id: string) => materials.find((m) => m.id === id), [materials]);
  const getMaterialTransactions = useCallback((materialId: string) => transactions.filter((t) => t.materialId === materialId), [transactions]);

  // ─── Logging ─────────────────────────────────────────────────────────────

  const logPurchase = useCallback(
    async (materialId: string, quantity: number, cost: number, notes?: string, supplierId?: string) => {
      if (!activeProjectId || !project) return;
      const supplier = supplierId ? suppliers.find((s) => s.id === supplierId) : undefined;
      const newMats = materials.map((m) => m.id === materialId ? { ...m, purchased: m.purchased + quantity, totalCost: m.totalCost + cost } : m);
      const tx: Transaction = {
        id: genId(), type: "purchase", materialId,
        materialName: materials.find((m) => m.id === materialId)?.name ?? "",
        quantity, cost, date: new Date().toISOString(), notes, stage: project.stage,
        supplierId, supplierName: supplier?.name,
      };
      const newTxs = [tx, ...transactions];
      setMaterials(newMats);
      setTransactions(newTxs);
      await persistData(activeProjectId, newMats, newTxs);
    },
    [activeProjectId, project, materials, transactions, suppliers, persistData]
  );

  const logDelivery = useCallback(
    async (materialId: string, quantity: number, options?: DeliveryOptions) => {
      if (!activeProjectId || !project) return;
      const newMats = materials.map((m) => m.id === materialId ? { ...m, delivered: m.delivered + quantity } : m);
      const tx: Transaction = {
        id: genId(), type: "delivery", materialId,
        materialName: materials.find((m) => m.id === materialId)?.name ?? "",
        quantity, cost: options?.cost, date: new Date().toISOString(),
        notes: options?.notes, photoUri: options?.photoUri, stage: project.stage,
      };
      const newTxs = [tx, ...transactions];
      setMaterials(newMats);
      setTransactions(newTxs);
      await persistData(activeProjectId, newMats, newTxs);
    },
    [activeProjectId, project, materials, transactions, persistData]
  );

  const logUsage = useCallback(
    async (materialId: string, quantity: number, notes?: string) => {
      if (!activeProjectId || !project) return;
      const newMats = materials.map((m) => m.id === materialId ? { ...m, used: m.used + quantity } : m);
      const tx: Transaction = {
        id: genId(), type: "usage", materialId,
        materialName: materials.find((m) => m.id === materialId)?.name ?? "",
        quantity, date: new Date().toISOString(), notes, stage: project.stage,
      };
      const newTxs = [tx, ...transactions];
      setMaterials(newMats);
      setTransactions(newTxs);
      await persistData(activeProjectId, newMats, newTxs);
    },
    [activeProjectId, project, materials, transactions, persistData]
  );

  // ─── Suppliers ───────────────────────────────────────────────────────────

  const addSupplier = useCallback(
    async (data: Omit<Supplier, "id">) => {
      if (!activeProjectId) return;
      const newS: Supplier = { ...data, id: genId() };
      const newSuppliers = [...suppliers, newS];
      setSuppliers(newSuppliers);
      await persistSuppliers(activeProjectId, newSuppliers);
    },
    [activeProjectId, suppliers, persistSuppliers]
  );

  const updateSupplier = useCallback(
    async (id: string, data: Partial<Omit<Supplier, "id">>) => {
      if (!activeProjectId) return;
      const newSuppliers = suppliers.map((s) => s.id === id ? { ...s, ...data } : s);
      setSuppliers(newSuppliers);
      await persistSuppliers(activeProjectId, newSuppliers);
    },
    [activeProjectId, suppliers, persistSuppliers]
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      if (!activeProjectId) return;
      const newSuppliers = suppliers.filter((s) => s.id !== id);
      setSuppliers(newSuppliers);
      await persistSuppliers(activeProjectId, newSuppliers);
    },
    [activeProjectId, suppliers, persistSuppliers]
  );

  const getSupplierTransactions = useCallback(
    (supplierId: string) => transactions.filter((t) => t.supplierId === supplierId),
    [transactions]
  );

  // ─── Site Reports ────────────────────────────────────────────────────────

  const addSiteReport = useCallback(
    async (data: Omit<SiteReport, "id">) => {
      if (!activeProjectId) return;
      const newReport: SiteReport = { ...data, id: genId() };
      const newReports = [newReport, ...siteReports];
      setSiteReports(newReports);
      await persistReports(activeProjectId, newReports);
    },
    [activeProjectId, siteReports, persistReports]
  );

  const deleteSiteReport = useCallback(
    async (id: string) => {
      if (!activeProjectId) return;
      const newReports = siteReports.filter((r) => r.id !== id);
      setSiteReports(newReports);
      await persistReports(activeProjectId, newReports);
    },
    [activeProjectId, siteReports, persistReports]
  );

  // ─── Payments ────────────────────────────────────────────────────────────

  const addPayment = useCallback(
    async (data: Omit<Payment, "id">) => {
      if (!activeProjectId) return;
      const newPayment: Payment = { ...data, id: genId() };
      const newPayments = [newPayment, ...payments];
      setPayments(newPayments);
      await persistPayments(activeProjectId, newPayments);
    },
    [activeProjectId, payments, persistPayments]
  );

  const deletePayment = useCallback(
    async (id: string) => {
      if (!activeProjectId) return;
      const newPayments = payments.filter((p) => p.id !== id);
      setPayments(newPayments);
      await persistPayments(activeProjectId, newPayments);
    },
    [activeProjectId, payments, persistPayments]
  );

  // ─── Progress Photos ─────────────────────────────────────────────────────

  const addProgressPhoto = useCallback(
    async (data: Omit<ProgressPhoto, "id">) => {
      if (!activeProjectId) return;
      const newPhoto: ProgressPhoto = { ...data, id: genId() };
      const newPhotos = [newPhoto, ...progressPhotos];
      setProgressPhotos(newPhotos);
      await persistPhotos(activeProjectId, newPhotos);
    },
    [activeProjectId, progressPhotos, persistPhotos]
  );

  const deleteProgressPhoto = useCallback(
    async (id: string) => {
      if (!activeProjectId) return;
      const newPhotos = progressPhotos.filter((p) => p.id !== id);
      setProgressPhotos(newPhotos);
      await persistPhotos(activeProjectId, newPhotos);
    },
    [activeProjectId, progressPhotos, persistPhotos]
  );

  // ─── Computed ────────────────────────────────────────────────────────────

  const totalSpent = useMemo(
    () => materials.reduce((sum, m) => sum + m.totalCost, 0),
    [materials]
  );

  const totalLabourCost = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

  const alerts = useMemo(
    () => project ? computeAlerts(materials, { area: project.area, stage: project.stage, budget: project.budget }, totalSpent) : [],
    [materials, project, totalSpent]
  );

  const resetProject = useCallback(async () => {
    if (activeProjectId) await deleteProject(activeProjectId);
  }, [activeProjectId, deleteProject]);

  const value = useMemo(
    () => ({
      project, materials, transactions, alerts, isLoading, hasProject: project !== null,
      totalSpent, totalLabourCost, allProjects,
      createProject, switchProject, deleteProject, updateProject, setStage, setupProject,
      addMaterial, updateMaterial, deleteMaterial, getMaterial, getMaterialTransactions,
      logPurchase, logDelivery, logUsage,
      suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierTransactions,
      siteReports, addSiteReport, deleteSiteReport,
      payments, addPayment, deletePayment,
      progressPhotos, addProgressPhoto, deleteProgressPhoto,
      resetProject,
    }),
    [
      project, materials, transactions, alerts, isLoading, totalSpent, totalLabourCost, allProjects,
      createProject, switchProject, deleteProject, updateProject, setStage, setupProject,
      addMaterial, updateMaterial, deleteMaterial, getMaterial, getMaterialTransactions,
      logPurchase, logDelivery, logUsage,
      suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierTransactions,
      siteReports, addSiteReport, deleteSiteReport,
      payments, addPayment, deletePayment,
      progressPhotos, addProgressPhoto, deleteProgressPhoto,
      resetProject,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
