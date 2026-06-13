export declare const StaffModel: {
    create: (data: {
        name: string;
        email: string;
        phone?: string;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        salonId: string;
        branchId?: string;
        reportingManagerId?: string;
    }) => Promise<{
        branch: {
            name: string;
            id: string;
        } | null;
        reportingManager: {
            name: string;
            id: string;
            jobRole: string;
        } | null;
    } & {
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    }>;
    findBySalon: (salonId: string) => Promise<({
        branch: {
            name: string;
            id: string;
        } | null;
        reportingManager: {
            name: string;
            id: string;
            jobRole: string;
        } | null;
    } & {
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    })[]>;
    findAll: () => Promise<({
        salon: {
            name: string;
            id: string;
        };
        branch: {
            name: string;
            id: string;
        } | null;
        reportingManager: {
            name: string;
            id: string;
            jobRole: string;
        } | null;
    } & {
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    })[]>;
    findById: (id: string) => Promise<({
        salon: {
            name: string;
            id: string;
        };
        branch: {
            name: string;
            id: string;
        } | null;
        reportingManager: {
            name: string;
            id: string;
            jobRole: string;
        } | null;
    } & {
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    }) | null>;
    findByIdAndSalon: (id: string, salonId: string) => Promise<({
        branch: {
            name: string;
            id: string;
        } | null;
        reportingManager: {
            name: string;
            id: string;
            jobRole: string;
        } | null;
    } & {
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    }) | null>;
    update: (id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        jobRole?: string;
        workingFrom?: string;
        workingTo?: string;
        weekOff?: string;
        branchId?: string | null;
        reportingManagerId?: string | null;
    }) => Promise<{
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    }>;
    updateStatus: (id: string, status: boolean) => Promise<{
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    }>;
    delete: (id: string) => Promise<{
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        reportingManagerId: string | null;
        branchId: string | null;
    }>;
};
//# sourceMappingURL=staff.model.d.ts.map