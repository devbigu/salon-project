const hasRole = (role, roles) => roles.includes(role);

const getMenu = (role) => {
  const operationalRoles = [
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "RECEPTIONIST",
    "STAFF",
  ];

  return [
  {
    icon: "dashboard-fill",
    text: "Dashboard",
    link: "/",
  },
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
  ...(hasRole(role, operationalRoles)
    ? [
        { heading: "Products" },
        {
          icon: "package-fill",
          text: "Inventory",
          subMenu: [
            { text: "Product Brands", link: "/admin/product-brands" },
            { text: "Products", link: "/admin/products" },
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN"])
              ? [{ text: "Purchase Products", link: "/admin/product-purchases" }]
              : []),
            ...(hasRole(role, ["SUPER_ADMIN", "SALON_ADMIN", "RECEPTIONIST"])
              ? [{ text: "Retail Products", link: "/admin/retail-products" }]
              : []),
            { text: "Low Stock / Movements", link: "/admin/stock-movements" },
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
