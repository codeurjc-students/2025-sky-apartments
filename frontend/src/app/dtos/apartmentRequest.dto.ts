export interface ApartmentRequestDTO {
    name: string;
    description: string;
    price: number;
    services: Set<string>;
    capacity: number;
    images: File[];
}