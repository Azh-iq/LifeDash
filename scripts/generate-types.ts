#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Script to generate TypeScript types from Supabase database schema
 * 
 * This script:
 * - Validates Supabase credentials
 * - Generates types using Supabase CLI
 * - Creates comprehensive TypeScript definitions
 * - Handles errors gracefully
 * 
 * Usage: npm run generate-types
 */

interface SupabaseConfig {
  projectUrl: string
  anonKey: string
  serviceRoleKey?: string
}

/**
 * Validates that required Supabase environment variables are set
 */
function validateSupabaseCredentials(): SupabaseConfig {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!projectUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  // Extract project ID from URL
  const urlMatch = projectUrl.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)
  if (!urlMatch) {
    throw new Error('Invalid Supabase URL format. Expected: https://[project-id].supabase.co')
  }

  return {
    projectUrl,
    anonKey,
    serviceRoleKey,
  }
}

/**
 * Generates TypeScript types from Supabase schema
 */
async function generateTypes() {
  try {
    console.log('🔍 Validating Supabase credentials...')
    const config = validateSupabaseCredentials()
    
    console.log('✅ Credentials valid')
    console.log(`🌐 Project URL: ${config.projectUrl}`)

    const outputPath = join(process.cwd(), 'lib/types/database.types.ts')
    console.log(`📝 Generating types to: ${outputPath}`)

    // Generate types using Supabase CLI
    const command = `npx supabase gen types typescript --project-id ${config.projectUrl.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)![1]} --schema public`
    
    console.log('🚀 Running Supabase type generation...')
    const output = execSync(command, { encoding: 'utf-8' })

    // Write the generated types to file
    writeFileSync(outputPath, output)

    console.log('✅ Database types generated successfully!')
    console.log(`📄 Types written to: ${outputPath}`)
    
    // Verify the file was created
    if (existsSync(outputPath)) {
      const stats = require('fs').statSync(outputPath)
      console.log(`📊 File size: ${Math.round(stats.size / 1024)}KB`)
    }

  } catch (error) {
    console.error('❌ Failed to generate types:')
    
    if (error instanceof Error) {
      console.error(`   ${error.message}`)
      
      // Provide helpful suggestions based on error type
      if (error.message.includes('command not found')) {
        console.error('\n💡 Suggestion: Install Supabase CLI globally:')
        console.error('   npm install -g supabase')
      } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
        console.error('\n💡 Suggestion: Check your Supabase credentials:')
        console.error('   - Verify NEXT_PUBLIC_SUPABASE_URL is correct')
        console.error('   - Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is valid')
        console.error('   - Ensure you have access to the project')
      } else if (error.message.includes('project not found')) {
        console.error('\n💡 Suggestion: Verify your project URL and ensure the project exists')
      }
    } else {
      console.error('   Unknown error occurred')
    }
    
    process.exit(1)
  }
}

/**
 * Creates a placeholder types file if generation fails
 */
function createPlaceholderTypes() {
  const outputPath = join(process.cwd(), 'lib/types/database.types.ts')
  
  const placeholderContent = `/**
 * Placeholder database types for LifeDash
 * 
 * Run 'npm run generate-types' to generate actual types from your Supabase schema.
 * Make sure to set up your Supabase credentials first:
 * 
 * NEXT_PUBLIC_SUPABASE_URL=your_project_url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Your tables will appear here after running type generation
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: unknown[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database["public"]["Enums"])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]]["Enums"])
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]]["Enums"])[EnumName]
  : PublicEnumNameOrOptions extends keyof (Database["public"]["Enums"])
    ? (Database["public"]["Enums"])[PublicEnumNameOrOptions]
    : never
`

  writeFileSync(outputPath, placeholderContent)
  console.log(`📝 Created placeholder types file: ${outputPath}`)
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const shouldCreatePlaceholder = args.includes('--placeholder')

  if (shouldCreatePlaceholder) {
    createPlaceholderTypes()
  } else {
    generateTypes()
  }
}

export { generateTypes, createPlaceholderTypes }