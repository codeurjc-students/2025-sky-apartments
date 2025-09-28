
export interface ApartmentDTO {
    id: number;
    name: string;
    description: string;
    price: number;
    services: Set<String>;
    capacity: number;
    imageUrl: string;
}