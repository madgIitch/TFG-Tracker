export interface CityOption {
  id: string;
  name: string;
  province_code: string | null;
}

export interface ZoneOption {
  id: string;
  city_id: string;
  name: string;
}
