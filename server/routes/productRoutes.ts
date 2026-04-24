import { Router } from "express";
import * as productController from "../controllers/productController";
import { verifyToken, isDemoBlocked } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { productSchema, updateProductSchema } from "../schemas/productSchema";

const router = Router();

router.get("/", verifyToken, productController.getProducts);
router.post("/", verifyToken, isDemoBlocked, validate(productSchema), productController.createProduct);
router.get("/:id/items", verifyToken, productController.getProductItems);
router.get("/by-serial/:serial", verifyToken, productController.getBySerial);
router.put("/:id", verifyToken, isDemoBlocked, validate(updateProductSchema), productController.updateProduct);
router.delete("/:id", verifyToken, isDemoBlocked, productController.deleteProduct);

export default router;
