export interface Client {
    id?: string;
    photoUrl?: string;
    firstName: string;
    lastName: string;
    phone: string; // formatted "0000-0000"
    email?: string;
    address?: string;
    birthday?: string; // ISO date
    preferences?: string;
    paymentMethod?: "None" | "Sinpe Movil" | "Transfer" | "Cash";
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}
