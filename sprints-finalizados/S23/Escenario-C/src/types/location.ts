export interface LocationCity {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationZone {
  id: string;
  name: string;
  city_id?: string;
  city_name?: string;
}
