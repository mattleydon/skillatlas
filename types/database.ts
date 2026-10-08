export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string
          iso2: string
          name: string
          region: string
        }
        Insert: {
          id: string
          iso2: string
          name: string
          region: string
        }
        Update: {
          id?: string
          iso2?: string
          name?: string
          region?: string
        }
        Relationships: []
      }
      identity_places: {
        Row: {
          flag_code: string | null
          id: string
          iso2: string | null
          name: string
          parent_country_id: string | null
          place_type: Database["public"]["Enums"]["identity_place_type"]
          region: string
          sovereign_country_id: string | null
        }
        Insert: {
          flag_code?: string | null
          id: string
          iso2?: string | null
          name: string
          parent_country_id?: string | null
          place_type: Database["public"]["Enums"]["identity_place_type"]
          region: string
          sovereign_country_id?: string | null
        }
        Update: {
          flag_code?: string | null
          id?: string
          iso2?: string | null
          name?: string
          parent_country_id?: string | null
          place_type?: Database["public"]["Enums"]["identity_place_type"]
          region?: string
          sovereign_country_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_places_parent_country_id_fkey"
            columns: ["parent_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_places_sovereign_country_id_fkey"
            columns: ["sovereign_country_id"]
            isOneToOne: true
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_favourite_games: {
        Row: {
          game_id: string
          position: number
          profile_id: string
        }
        Insert: {
          game_id: string
          position: number
          profile_id: string
        }
        Update: {
          game_id?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_favourite_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "profile_game_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favourite_games_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_game_catalogue: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      profile_heritage_countries: {
        Row: {
          country_id: string
          position: number
          profile_id: string
        }
        Insert: {
          country_id: string
          position: number
          profile_id: string
        }
        Update: {
          country_id?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_heritage_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "identity_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_heritage_countries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_version: string | null
          bio: string | null
          birth_country_id: string | null
          birth_country_is_public: boolean
          city_town: string | null
          city_town_is_public: boolean
          created_at: string
          display_name: string
          favourite_games_is_public: boolean
          gaming_since: number | null
          gaming_since_is_public: boolean
          heritage_is_public: boolean
          id: string
          platform_ids: string[]
          platforms_is_public: boolean
          representing_country_id: string | null
          residence_country_id: string | null
          residence_country_is_public: boolean
          updated_at: string
          username: string
          username_case_corrected_at: string | null
          username_case_correction_available: boolean
        }
        Insert: {
          avatar_version?: string | null
          bio?: string | null
          birth_country_id?: string | null
          birth_country_is_public?: boolean
          city_town?: string | null
          city_town_is_public?: boolean
          created_at?: string
          display_name: string
          favourite_games_is_public?: boolean
          gaming_since?: number | null
          gaming_since_is_public?: boolean
          heritage_is_public?: boolean
          id: string
          platform_ids?: string[]
          platforms_is_public?: boolean
          representing_country_id?: string | null
          residence_country_id?: string | null
          residence_country_is_public?: boolean
          updated_at?: string
          username: string
          username_case_corrected_at?: string | null
          username_case_correction_available?: boolean
        }
        Update: {
          avatar_version?: string | null
          bio?: string | null
          birth_country_id?: string | null
          birth_country_is_public?: boolean
          city_town?: string | null
          city_town_is_public?: boolean
          created_at?: string
          display_name?: string
          favourite_games_is_public?: boolean
          gaming_since?: number | null
          gaming_since_is_public?: boolean
          heritage_is_public?: boolean
          id?: string
          platform_ids?: string[]
          platforms_is_public?: boolean
          representing_country_id?: string | null
          residence_country_id?: string | null
          residence_country_is_public?: boolean
          updated_at?: string
          username?: string
          username_case_corrected_at?: string | null
          username_case_correction_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_birth_country_id_fkey"
            columns: ["birth_country_id"]
            isOneToOne: false
            referencedRelation: "identity_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_representing_country_id_fkey"
            columns: ["representing_country_id"]
            isOneToOne: false
            referencedRelation: "identity_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_residence_country_id_fkey"
            columns: ["residence_country_id"]
            isOneToOne: false
            referencedRelation: "identity_places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_member_profile: {
        Args: { p_username: string }
        Returns: {
          avatar_version: string
          bio: string
          birth_country: Json
          city_town: string
          created_at: string
          display_name: string
          favourite_game_ids: string[]
          gaming_since: number
          heritage: Json
          platform_ids: string[]
          representing_country: Json
          residence_country: Json
          username: string
        }[]
      }
      update_profile_country_identity: {
        Args: {
          p_birth_country_id: string
          p_birth_country_is_public: boolean
          p_city_town: string
          p_city_town_is_public: boolean
          p_heritage_country_ids: string[]
          p_heritage_is_public: boolean
          p_representing_country_id: string
          p_residence_country_id: string
          p_residence_country_is_public: boolean
        }
        Returns: undefined
      }
      update_profile_gaming_identity: {
        Args: {
          p_game_ids: string[]
          p_games_is_public: boolean
          p_gaming_since: number
          p_gaming_since_is_public: boolean
          p_platform_ids: string[]
          p_platforms_is_public: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      identity_place_type: "sovereign_country" | "constituent_country"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      identity_place_type: ["sovereign_country", "constituent_country"],
    },
  },
} as const
