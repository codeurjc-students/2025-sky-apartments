
export interface ApartmentDTO {
    id: number;
    name: string;
    description: string;
    price: number;
    services: Set<string>;
    capacity: number;
    imageUrl: string;
}