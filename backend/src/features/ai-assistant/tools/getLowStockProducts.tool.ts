import { prisma } from "../../../config/prisma.js";
import type { AiTool } from "../ai-tool.types.js";
import { aiSharedBranchScope } from "../ai-permission.service.js";

export const getLowStockProductsTool: AiTool = {
  name: "getLowStockProducts",
  description: "Returns products at or below their low-stock threshold.",
  allowedRoles: ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"],

  async run({ context }) {
    const products = await prisma.product.findMany({
      where: {
        ...(context.salonId ? { salonId: context.salonId } : {}),
        ...aiSharedBranchScope(context),
        status: true,
        lowStockAlert: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        branchId: true,
        currentStock: true,
        lowStockAlert: true,
      },
      orderBy: { name: "asc" },
    });

    const lowStock = products.filter(
      (product) =>
        Number(product.currentStock) <= Number(product.lowStockAlert)
    );

    return {
      summary: `${lowStock.length} product${
        lowStock.length === 1 ? " is" : "s are"
      } low on stock.`,
      data: {
        total: lowStock.length,
        products: lowStock.slice(0, 20).map((product) => ({
          ...product,
          currentStock: Number(product.currentStock),
          lowStockAlert: Number(product.lowStockAlert),
        })),
        truncated: lowStock.length > 20,
      },
    };
  },
};
