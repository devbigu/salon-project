export declare const BranchModel: {
    create: (data: {
        name: string;
        salonId: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        phone?: string;
    }) => Promise<{
        salonId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        phone: string | null;
    }>;
    findBySalon: (salonId: string) => Promise<{
        salonId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        phone: string | null;
    }[]>;
    findAll: () => Promise<({
        salon: {
            name: string;
            id: string;
        };
    } & {
        salonId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        phone: string | null;
    })[]>;
    findByIdAndSalon: (id: string, salonId: string) => Promise<{
        salonId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        phone: string | null;
    } | null>;
    findByIdandSalon: (id: string, salonId: string) => Promise<{
        salonId: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        phone: string | null;
    } | null>;
};
//# sourceMappingURL=branch.model.d.ts.map