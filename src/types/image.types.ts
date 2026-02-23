export interface ImageRecord {
  id?: number
  entityType: string   // 'sprint_observation' | 'incidence' | 'prompt_eval'
  entityKey: string    // e.g. 'A_7' | 'A_7_<uuid>' | '<promptId>_B'
  data: string         // base64 data URL
  createdAt: string
}
