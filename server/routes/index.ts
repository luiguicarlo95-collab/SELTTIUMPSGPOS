import { Router } from "express";
import authRoutes from "./authRoutes";
import productRoutes from "./productRoutes";
import * as dashboardController from "../controllers/dashboardController";
import * as categoryController from "../controllers/categoryController";
import * as saleController from "../controllers/saleController";
import * as settingsController from "../controllers/saleController"; // Shared controller for simplicity
import * as backupController from "../controllers/backupController";
import * as developerController from "../controllers/developerController";
import * as userController from "../controllers/userController";
import { verifyToken, checkRole, isDemoBlocked } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { userSchema, updateUserSchema } from "../schemas/userSchema";
import { settingsSchema } from "../schemas/settingsSchema";

const router = Router();

// Auth
router.use("/auth", authRoutes);

// Dashboard
router.get("/dashboard/stats", verifyToken, dashboardController.getStats);

// Products
router.use("/products", productRoutes);

// Categories
router.get("/categories", verifyToken, categoryController.getCategories);
router.post("/categories", verifyToken, isDemoBlocked, categoryController.createCategory);
router.put("/categories/:id", verifyToken, isDemoBlocked, categoryController.updateCategory);
router.delete("/categories/:id", verifyToken, isDemoBlocked, categoryController.deleteCategory);

// Suppliers
router.get("/suppliers", verifyToken, categoryController.getSuppliers);
router.post("/suppliers", verifyToken, isDemoBlocked, categoryController.createSupplier);
router.put("/suppliers/:id", verifyToken, isDemoBlocked, categoryController.updateSupplier);
router.delete("/suppliers/:id", verifyToken, isDemoBlocked, categoryController.deleteSupplier);

// Customers
router.get("/customers", verifyToken, categoryController.getCustomers);
router.post("/customers", verifyToken, isDemoBlocked, categoryController.createCustomer);
router.put("/customers/:id", verifyToken, isDemoBlocked, categoryController.updateCustomer);
router.delete("/customers/:id", verifyToken, isDemoBlocked, categoryController.deleteCustomer);
router.post("/customers/:customerId/payments", verifyToken, isDemoBlocked, saleController.recordPayment);
router.get("/customers/:customerId/payments", verifyToken, saleController.getCustomerPayments);

// Sales
router.get("/sales", verifyToken, saleController.getSales);
router.get("/sales/:id", verifyToken, saleController.getSaleById);
router.post("/sales", verifyToken, saleController.createSale);

// Quotations
router.get("/quotations", verifyToken, saleController.getQuotations);
router.post("/quotations", verifyToken, isDemoBlocked, saleController.createQuotation);

// Cash Flow
router.get("/cash-flow", verifyToken, saleController.getTransactions);
router.post("/cash-flow", verifyToken, isDemoBlocked, saleController.createTransaction);
router.delete("/cash-flow/:id", verifyToken, isDemoBlocked, saleController.deleteTransaction);

// Settings
router.get("/settings", verifyToken, saleController.getSettings);
router.post("/settings", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), validate(settingsSchema), saleController.updateSettings);

// Users
router.get("/users", verifyToken, userController.getUsers);
router.post("/users", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), isDemoBlocked, validate(userSchema), userController.createUser);
router.put("/users/:id", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), isDemoBlocked, validate(updateUserSchema), userController.updateUser);
router.delete("/users/:id", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), isDemoBlocked, userController.deleteUser);

// Backup
router.get("/backup/all", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), backupController.exportAll);
router.post("/import", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), isDemoBlocked, backupController.importAll);

// Developer
router.post("/activate-demo", verifyToken, checkRole(['DESARROLLADOR']), developerController.activateDemo);
router.post("/activate", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), developerController.activateSystem);
router.post("/license/activate", verifyToken, checkRole(['DESARROLLADOR']), developerController.activateLicense);
router.post("/license/reset", verifyToken, checkRole(['DESARROLLADOR']), developerController.resetLicense);
router.post("/demo/reset", verifyToken, checkRole(['DESARROLLADOR']), developerController.resetDemo);

export default router;
