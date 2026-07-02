const hasRole = (role, roles) => roles.includes(role);


const getMenu = (role) => {
  const operationalRoles = [
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "RECEPTIONIST",
    "STAFF",
  ];
  const inventoryRoles = [...operationalRoles, "BRANCH_MANAGER"];

  return [
  {
    icon: "dashboard-fill",
    text: "Dashboard",
    link: "/",
  },
  ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST", "STAFF"])
    ? [
        { heading: "Staff Operations" },
        {
          icon: "users-fill",
          text: "Staff Operations",
          subMenu: [
            { text: "Attendance", link: "/staff-operations/attendance" },
            ...(role !== "RECEPTIONIST" ? [{ text: "Leaves", link: "/staff-operations/leaves" }] : []),
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"])
              ? [{ text: "Salary Config", link: "/staff-operations/salary-config" }]
              : []),
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER", "STAFF"])
              ? [{ text: "Salary Slips", link: "/staff-operations/salary-slips" }]
              : []),
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "BRANCH_MANAGER"])
              ? [{ text: "Staff Performance", link: "/reports/staff-performance" }]
              : []),
          ],
        },
      ]
    : []),
  ...(hasRole(role, operationalRoles)
    ? [
        { heading: "Operations" },
        {
          icon: "calender-date-fill",
          text: "Appointments",
          link: "/appointments",
        },
        {
          icon: "users-fill",
          text: "Customers",
          link: "/customers",
        },
        {
          icon: "scissors",
          text: "Service Catalog",
          link: "/services",
        },
      ]
    : []),
  ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "STAFF"])
    ? [
        {
          icon: "file-docs",
          text: "Billing & Payments",
          link: "/billing",
        },
      ]
    : []),
  ...(hasRole(role, inventoryRoles)
    ? [
        { heading: "Products" },
        {
          icon: "package-fill",
          text: "Product",
          subMenu: [
            { text: "Product Brand", link: "/admin/product-brands" },
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN"])
              ? [{ text: "Purchase Products", link: "/admin/product-purchases" }]
              : []),
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST"])
              ? [{ text: "Retail Products", link: "/admin/retail-products" }]
              : []),
          ],
        },
      ]
    : []),
  ...(hasRole(role, inventoryRoles)
    ? [
        { heading: "Vendors & Stock" },
        {
          icon: "package-fill",
          text: "Vendors & Stock",
          subMenu: [
            { text: "Products", link: "/admin/products" },
            { text: "Vendors", link: "/admin/vendors" },
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN"])
              ? [
                  {
                    text: "Vendor Payments",
                    link: "/admin/vendor-payments",
                  },
                ]
              : []),
            {
              text: "Stock Movements",
              link: "/admin/stock-movements",
            },
            { text: "Low Stock", link: "/admin/low-stock" },
          ],
        },
      ]
    : []),
  ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN"])
    ? [
        { heading: "Expenses" },
        {
          icon: "money",
          text: "Expenses",
          subMenu: [
            { text: "Expense Categories", link: "/admin/expense-categories" },
            { text: "Expenses", link: "/admin/expenses" },
          ],
        },
      ]
    : []),
  ...(hasRole(role, inventoryRoles)
    ? [
        { heading: "Reports" },
        {
          icon: "reports",
          text: "Reports",
          subMenu: [
            { text: "Inventory Report", link: "/reports/inventory" },
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN"])
              ? [{ text: "Profit Summary", link: "/reports/profit-summary" }]
              : []),
          ],
        },
      ]
    : []),
  ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST"])
    ? [
        {
          heading: "Administration",
        },
        {
          icon: "building",
          text: "Salon Management",
          link: "/management",
        },
      ]
    : []),
  { heading: "Help" },
  ...(hasRole(role, operationalRoles)
    ? [
        {
          icon: "help",
          text: role === "SUPER_ADMIN" ? "Support Queue" : "Support",
          link: "/support",
        },
      ]
    : []),
  {
    icon: "policy",
    text: "Terms & Policy",
    link: "/pages/terms-policy",
  },
  ];
};

export default getMenu;
