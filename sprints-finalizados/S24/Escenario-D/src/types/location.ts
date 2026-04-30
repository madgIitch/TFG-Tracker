export interface CityOption {
  id: string;
  name: string;
  centroid?: { lat: number; lon: number } | string;
  province_code?: string;
}

export interface CityPlaceOption {
  id: string;
  city_id: string;
  name: string;
  centroid?: { lat: number; lon: number } | string;
}
