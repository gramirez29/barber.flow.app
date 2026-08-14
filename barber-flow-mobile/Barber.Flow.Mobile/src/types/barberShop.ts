export interface BarberShop {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BarberShopDraft {
    name: string;
    phone?: string;
    address?: string;
}
