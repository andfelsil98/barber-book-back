import { Router } from "express";
import { AuthRoutes } from "./auth/routes";
import { BranchRoutes } from "./branch/routes";
import { BusinessRoutes } from "./business/routes";
import { ServiceRoutes } from "./service/routes";
import { ModuleRoutes } from "./module/routes";
import { PermissionRoutes } from "./permission/routes";
import { RoleRoutes } from "./role/routes";
import { BusinessMembershipRoutes } from "./business-membership/routes";
import { UsersRoutes } from "./users/routes";

export class AppRoutes {
  static get routes(): Router {
    const router = Router();
    router.use("/api/auth", AuthRoutes.routes);
    router.use("/api/business", BusinessRoutes.routes);
    router.use("/api/branches", BranchRoutes.routes);
    router.use("/api/services", ServiceRoutes.routes);
    router.use("/api/modules", ModuleRoutes.routes);
    router.use("/api/permissions", PermissionRoutes.routes);
    router.use("/api/roles", RoleRoutes.routes);
    router.use("/api/business-memberships", BusinessMembershipRoutes.routes);
    router.use("/api/users", UsersRoutes.routes);
    // // Products
    // router.use('/api/products', ProductsRoutes.routes);
    // // Categories
    // router.use('/api/categories', CategoriesRoutes.routes);
    // // Orders
    // router.use('/api/orders', OrdersRoutes.routes);
    // // Pets
    // router.use('/api/pets', PetsRoutes.routes);
    // // Carts
    // router.use('/api/carts', CartsRoutes.routes);
    // // Catalog
    // router.use('/api/catalog', CatalogRoutes.routes);
    return router;
  }
}
