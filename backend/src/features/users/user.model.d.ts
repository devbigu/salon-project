export declare const UserModel: {
    findByEmail: (email: string) => Promise<{
        role: import("../../../generated/prisma/enums.js").Role;
        salonId: string | null;
        name: string;
        email: string;
        phone_number: string | null;
        id: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createSalonAdmin: (data: {
        name: string;
        email: string;
        phone_number: string;
        passwordHash: string;
        salonId: string;
    }) => Promise<{
        role: import("../../../generated/prisma/enums.js").Role;
        salonId: string | null;
        name: string;
        email: string;
        phone_number: string | null;
        id: string;
        createdAt: Date;
    }>;
    findByPhoneNumber: (phone_number: string) => Promise<{
        role: import("../../../generated/prisma/enums.js").Role;
        salonId: string | null;
        name: string;
        email: string;
        phone_number: string | null;
        id: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create: (data: {
        name: string;
        email: string;
        phone_number?: string;
        passwordHash: string;
        role?: "SUPER_ADMIN" | "SALON_ADMIN" | "STAFF";
        salonId?: string;
    }) => Promise<{
        role: import("../../../generated/prisma/enums.js").Role;
        salonId: string | null;
        name: string;
        email: string;
        phone_number: string | null;
        id: string;
        createdAt: Date;
    }>;
};
//# sourceMappingURL=user.model.d.ts.map